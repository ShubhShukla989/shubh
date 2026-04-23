'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StickyNote, Edit2, Save, X, Trash2, Plus } from 'lucide-react';

interface Note {
  id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  created_by_name: string;
  created_by_email: string;
}

interface AdminNotesBoxProps {
  isSuperAdmin: boolean;
}

export default function AdminNotesBox({ isSuperAdmin }: AdminNotesBoxProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch notes with useCallback
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notes');
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.notes);
      }
    } catch (error) {
      // Silent fail - error handled by UI state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Start editing with useCallback
  const startEdit = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  }, []);

  // Cancel editing with useCallback
  const cancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditContent('');
  }, []);

  // Save note with useCallback
  const saveNote = useCallback(async (noteId?: number) => {
    try {
      setSaving(true);
      const content = noteId ? editContent : newNoteContent;
      
      const response = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          noteId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchNotes();
        setEditingNoteId(null);
        setEditContent('');
        setIsCreating(false);
        setNewNoteContent('');
      } else {
        alert(data.error || 'Failed to save note');
      }
    } catch (error) {
      alert('❌ Failed to save note');
    } finally {
      setSaving(false);
    }
  }, [editContent, newNoteContent, fetchNotes]);

  // Delete note with useCallback
  const deleteNote = useCallback(async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/admin/notes?id=${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchNotes();
      } else {
        alert(data.error || 'Failed to delete note');
      }
    } catch (error) {
      alert('❌ Failed to delete note');
    }
  }, [fetchNotes]);

  // Format date with useMemo
  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Cancel create with useCallback
  const cancelCreate = useCallback(() => {
    setIsCreating(false);
    setNewNoteContent('');
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-2 rounded-lg">
            <StickyNote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Admin Notes</h2>
            <p className="text-sm text-gray-600">
              {isSuperAdmin ? 'Create and manage notes' : 'View important notes'}
            </p>
          </div>
        </div>
        
        {isSuperAdmin && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        )}
      </div>

      {/* Create new note form */}
      {isCreating && isSuperAdmin && (
        <div className="mb-4 bg-white rounded-lg p-4 shadow-md border border-yellow-200">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write your note here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            rows={4}
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => saveNote()}
              disabled={saving || !newNoteContent.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Note'}
            </button>
            <button
              onClick={cancelCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notes yet</p>
            {isSuperAdmin && (
              <p className="text-xs mt-1">Click "New Note" to create one</p>
            )}
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg p-4 shadow-md border border-yellow-200 hover:shadow-lg transition-shadow"
            >
              {editingNoteId === note.id ? (
                // Edit mode
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => saveNote(note.id)}
                      disabled={saving || !editContent.trim()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <p className="text-gray-800 whitespace-pre-wrap mb-3">{note.content}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                    <div>
                      <span className="font-medium">{note.created_by_name}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(note.updated_at)}</span>
                    </div>
                    
                    {isSuperAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(note)}
                          className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
