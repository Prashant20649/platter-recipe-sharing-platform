import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Check, Plus, Bookmark } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CollectionModal({ recipe, isOpen, onClose }) {
  const toast = useToast();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  // New collection form state
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await api.getCollections();
      setCollections(data.collections || []);
    } catch (err) {
      toast.error('Failed to load your collections.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !recipe) return null;

  const handleAddToCollection = async (collection) => {
    const isAlreadyIn = collection.recipes?.some(
      (r) => (typeof r === 'string' ? r : r._id) === recipe._id
    );

    if (isAlreadyIn) {
      toast.info(`'${recipe.title}' is already in '${collection.name}'.`);
      return;
    }

    try {
      setAddingId(collection._id);
      const res = await api.addRecipeToCollection(collection._id, recipe._id);
      toast.success(res.message);
      await loadCollections();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not add to collection.');
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a collection name.');
      return;
    }

    try {
      setCreating(true);
      const colRes = await api.createCollection({ name: name.trim(), description: description.trim() });
      await api.addRecipeToCollection(colRes.collection._id, recipe._id);
      toast.success(`Created '${name}' and added '${recipe.title}'!`);
      setName('');
      setDescription('');
      setShowCreate(false);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not create collection.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-orange-600" />
            <h2 id="modal-headline" className="font-bold text-stone-900 text-lg">
              Save to Collection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-stone-500 font-medium">
            Saving: <span className="font-semibold text-stone-800">{recipe.title}</span>
          </p>

          {loading ? (
            <div className="py-8 text-center text-stone-400 text-sm">Loading collections...</div>
          ) : collections.length === 0 && !showCreate ? (
            <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-xl p-4">
              <FolderPlus className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">No collections yet</p>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                Create a collection to organize your favorite culinary discoveries.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create First Collection
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((col) => {
                const isAlreadyIn = col.recipes?.some(
                  (r) => (typeof r === 'string' ? r : r._id) === recipe._id
                );

                return (
                  <button
                    key={col._id}
                    disabled={addingId === col._id || isAlreadyIn}
                    onClick={() => handleAddToCollection(col)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isAlreadyIn
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 cursor-default'
                        : 'bg-white hover:bg-orange-50/60 border-stone-200 hover:border-orange-300 text-stone-800 shadow-sm'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold text-sm truncate">{col.name}</div>
                      <div className="text-xs text-stone-500">
                        {col.recipes?.length || 0} recipe{(col.recipes?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div>
                      {isAlreadyIn ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" /> Saved
                        </span>
                      ) : addingId === col._id ? (
                        <span className="text-xs text-orange-600 font-semibold animate-pulse">
                          Adding...
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-orange-600 bg-orange-100/60 px-2.5 py-1 rounded-full group-hover:bg-orange-200">
                          Add
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Toggle Create New Collection */}
          {!showCreate && collections.length > 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-2.5 border border-dashed border-stone-300 hover:border-orange-400 text-stone-600 hover:text-orange-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> New Collection
            </button>
          )}

          {/* Create New Collection Inline Form */}
          {showCreate && (
            <form onSubmit={handleCreateAndAdd} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  New Collection
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cozy Soups, Taco Night..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief note about this collection"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {creating ? 'Creating & Adding...' : 'Create & Save Recipe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
