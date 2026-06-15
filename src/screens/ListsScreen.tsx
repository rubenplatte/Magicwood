import { useState } from 'react';
import { Heart, Target, Check, Zap, ChevronRight, Plus, Trash2, Pencil, ListChecks } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useFilters } from '../store/useFilters';
import { useUI } from '../store/useUI';
import { boulders } from '../lib/data';
import { defaultFilters, type Filters } from '../lib/filter';
import { minGradeNum, maxGradeNum } from '../lib/data';
import { OfflineCard } from '../components/OfflineCard';

export function ListsScreen() {
  const liked = useStore((s) => s.liked);
  const projects = useStore((s) => s.projects);
  const ticks = useStore((s) => s.ticks);
  const lists = useStore((s) => s.lists);
  const createList = useStore((s) => s.createList);
  const renameList = useStore((s) => s.renameList);
  const deleteList = useStore((s) => s.deleteList);

  const setFilters = useFilters((s) => s.set);
  const setTab = useUI((s) => s.setTab);

  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const tickList = Object.values(ticks);
  const flashes = tickList.filter((t) => t.style === 'flash').length;
  const redpoints = tickList.filter((t) => t.style === 'redpoint').length;

  // Navigate to Explore with a fresh filter set + the given patch applied.
  const openWith = (patch: Partial<Filters>) => {
    setFilters({ ...defaultFilters(minGradeNum, maxGradeNum), ...patch });
    setTab('explore');
  };

  const smart = [
    {
      label: 'Liked',
      icon: <Heart size={20} className="text-rose-400 fill-rose-400" />,
      count: Object.keys(liked).length,
      onClick: () => openWith({ likedOnly: true }),
    },
    {
      label: 'Projects',
      icon: <Target size={20} className="text-amber-400" />,
      count: Object.keys(projects).length,
      onClick: () => openWith({ projectsOnly: true }),
    },
    {
      label: 'Ticked',
      icon: <Check size={20} className="text-emerald-400" />,
      count: tickList.length,
      onClick: () => openWith({ tickedOnly: true }),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="safe-top px-4 pt-3 pb-2 bg-slate-900/95 border-b border-slate-800 sticky top-0 z-10">
        <h1 className="text-xl font-bold">My boulders</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Tick stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Sends" value={tickList.length} icon={<ListChecks size={16} />} />
          <Stat label="Flashes" value={flashes} icon={<Zap size={16} className="text-yellow-300" />} />
          <Stat label="Redpoints" value={redpoints} icon={<Check size={16} className="text-emerald-400" />} />
        </div>

        {/* Smart lists */}
        <section className="space-y-2">
          {smart.map((s) => (
            <button
              key={s.label}
              onClick={s.onClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/60"
            >
              {s.icon}
              <span className="font-medium flex-1 text-left">{s.label}</span>
              <span className="text-slate-400">{s.count}</span>
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          ))}
        </section>

        {/* Custom lists */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Lists
          </h2>
          <div className="space-y-2">
            {lists.length === 0 && (
              <p className="text-sm text-slate-500">
                Create lists to organise boulders — a tick list for your trip, warmups, must-dos…
              </p>
            )}
            {lists.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-800/60 border border-slate-700/60"
              >
                {editing === l.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => {
                      renameList(l.id, editName);
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameList(l.id, editName);
                        setEditing(null);
                      }
                    }}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 text-white outline-none"
                  />
                ) : (
                  <button
                    onClick={() => openWith({ listId: l.id })}
                    className="flex-1 flex items-center gap-2 text-left py-1"
                  >
                    <span className="font-medium">{l.name}</span>
                    <span className="text-slate-500 text-sm">{l.slugs.length}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditing(l.id);
                    setEditName(l.name);
                  }}
                  className="p-2 text-slate-400"
                  aria-label="Rename"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete list “${l.name}”?`)) deleteList(l.id);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  createList(newName);
                  setNewName('');
                }
              }}
              placeholder="New list name"
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-moss-500"
            />
            <button
              onClick={() => {
                if (newName.trim()) {
                  createList(newName);
                  setNewName('');
                }
              }}
              className="px-4 rounded-xl bg-moss-500 text-white font-medium inline-flex items-center gap-1"
            >
              <Plus size={18} />
            </button>
          </div>
        </section>

        {/* Extra feature, kept at the very bottom with a clear separator */}
        <hr className="border-slate-800 -mx-4" />
        <OfflineCard />

        <p className="text-xs text-slate-600 pt-2">
          {boulders.length} boulders · everything is saved on this device.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 py-3">
      <div className="flex items-center justify-center gap-1 text-2xl font-bold">{value}</div>
      <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mt-0.5">
        {icon} {label}
      </div>
    </div>
  );
}
