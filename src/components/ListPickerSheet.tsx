import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Sheet } from './Sheet';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import { getBoulder } from '../lib/data';

export function ListPickerSheet() {
  const slug = useUI((s) => s.listPickerSlug);
  const close = useUI((s) => s.closeListPicker);
  const lists = useStore((s) => s.lists);
  const addToList = useStore((s) => s.addToList);
  const removeFromList = useStore((s) => s.removeFromList);
  const createList = useStore((s) => s.createList);
  const [newName, setNewName] = useState('');

  const boulder = slug ? getBoulder(slug) : undefined;

  const create = () => {
    if (!slug) return;
    const id = createList(newName || 'New list');
    addToList(id, slug);
    setNewName('');
  };

  return (
    <Sheet
      open={!!slug}
      onClose={close}
      title={boulder ? `Add “${boulder.name}” to…` : 'Add to list'}
    >
      <div className="space-y-2 pb-2">
        {lists.length === 0 && (
          <p className="text-sm text-slate-400 py-2">
            No lists yet. Create one below — e.g. “Tick list”, “Warmups”, “Next trip”.
          </p>
        )}
        {lists.map((l) => {
          const inList = slug ? l.slugs.includes(slug) : false;
          return (
            <button
              key={l.id}
              onClick={() => slug && (inList ? removeFromList(l.id, slug) : addToList(l.id, slug))}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-slate-800"
            >
              <span className="font-medium">{l.name}</span>
              <span className="flex items-center gap-2 text-sm text-slate-400">
                {l.slugs.length}
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    inList ? 'bg-moss-500 text-white' : 'border border-slate-600'
                  }`}
                >
                  {inList && <Check size={15} />}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="New list name"
          className="flex-1 px-3 py-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-moss-500"
        />
        <button
          onClick={create}
          className="px-4 rounded-xl bg-moss-500 text-white font-medium inline-flex items-center gap-1"
        >
          <Plus size={18} /> Add
        </button>
      </div>
    </Sheet>
  );
}
