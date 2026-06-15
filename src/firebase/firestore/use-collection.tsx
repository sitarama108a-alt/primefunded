
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  type Query,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { useFirestore, useAuth } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

export function useCollection<T = DocumentData>(
  path: string | null,
  constraints: QueryConstraint[] = []
) {
  const db = useFirestore();
  const auth = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Ensure path and db exist. Security rules handle authentication requirements.
    if (!path || !db) {
      setLoading(false);
      return;
    }

    try {
      const collectionRef = collection(db, path);
      const q = query(collectionRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setData(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T))
          );
          setLoading(false);
        },
        async (serverError: any) => {
          // Handle Permission Denied and other Firestore errors
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'list',
          } satisfies SecurityRuleContext);

          if (serverError.code === 'permission-denied') {
            errorEmitter.emit('permission-error', permissionError);
          }
          
          setError(serverError);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('[useCollection] Initialization Error:', err);
      setError(err);
      setLoading(false);
    }
  }, [db, path, JSON.stringify(constraints)]);

  return { data, loading, error };
}
