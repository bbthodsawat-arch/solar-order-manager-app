import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { QuickNote, Transaction } from '../types';
import { useAuth } from './useAuth';

export function useQuickNotes() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'quick_notes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuickNote[];
      
      setNotes(fetchedNotes);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching quick notes:", error);
      handleFirestoreError(error, OperationType.LIST, 'quick_notes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addNote = async (
    content: string, 
    isImportant: boolean = false, 
    transaction?: Transaction | null,
    tags?: string[]
  ) => {
    if (!user) return;
    try {
      const noteData: Record<string, any> = {
        content: content.trim(),
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        userDisplayName: user.displayName || 'ผู้ใช้นามแฝง',
        userPhotoURL: user.photoURL || '',
        isImportant
      };

      if (tags && tags.length > 0) {
        noteData.tags = tags;
      }

      if (transaction && transaction.id) {
        noteData.transactionId = transaction.id;
        noteData.transactionCategory = transaction.saleOrderDetails?.customerName || transaction.category;
        noteData.transactionAmount = transaction.amount;
        noteData.transactionType = transaction.type;
        noteData.transactionDate = transaction.date;
        if (transaction.detail) {
          noteData.transactionDetail = transaction.detail;
        }

        // Also sync transaction's quick note annotation field
        try {
          await updateDoc(doc(db, 'transactions', transaction.id), {
            notes: content.trim()
          });
        } catch (err) {
          console.warn("Could not sync note directly to transaction doc:", err);
        }
      }

      const docRef = await addDoc(collection(db, 'quick_notes'), noteData);
      return docRef.id;
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  };

  const updateNote = async (
    id: string, 
    newContent: string, 
    isImportant?: boolean,
    transactionId?: string
  ) => {
    try {
      const updates: Record<string, any> = {
        content: newContent.trim(),
        updatedAt: new Date().toISOString()
      };
      if (isImportant !== undefined) {
        updates.isImportant = isImportant;
      }
      await updateDoc(doc(db, 'quick_notes', id), updates);

      if (transactionId) {
        try {
          await updateDoc(doc(db, 'transactions', transactionId), {
            notes: newContent.trim()
          });
        } catch (err) {
          console.warn("Could not sync note updates to transaction:", err);
        }
      }
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  const deleteNote = async (id: string, transactionId?: string) => {
    try {
      await deleteDoc(doc(db, 'quick_notes', id));
      
      if (transactionId) {
        // If no other notes exist for this transaction, clear transaction.notes
        const remainingTxNotes = notes.filter(n => n.id !== id && n.transactionId === transactionId);
        if (remainingTxNotes.length === 0) {
          try {
            await updateDoc(doc(db, 'transactions', transactionId), {
              notes: deleteField()
            });
          } catch (err) {
            console.warn("Could not clear transaction note field:", err);
          }
        } else {
          try {
            await updateDoc(doc(db, 'transactions', transactionId), {
              notes: remainingTxNotes[0].content
            });
          } catch (err) {
            console.warn("Could not update transaction note field:", err);
          }
        }
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  const toggleNoteImportance = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'quick_notes', id), {
        isImportant: !currentStatus
      });
    } catch (error) {
      console.error("Error updating note status:", error);
      throw error;
    }
  };

  const getNotesForTransaction = useCallback((transactionId: string) => {
    return notes.filter(n => n.transactionId === transactionId);
  }, [notes]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    toggleNoteImportance,
    getNotesForTransaction
  };
}
