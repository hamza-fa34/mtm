import React, { useMemo, useRef, useState } from 'react';
import { Save, Lock, UserPlus, Trash2, Shield, Globe, Database, Download, Upload } from 'lucide-react';

import { useSettings } from '../context/SettingsContext';
import { APP_STORAGE_KEYS, AUTO_BACKUPS_STORAGE_KEY } from '../constants';
import { AutoBackupEntry, buildGlobalBackupPayload, downloadJSON, getAutoBackups, formatDate, saveAutoBackup } from '../utils';

type ImportStatus = { type: 'success' | 'error'; message: string } | null;

interface BackupPayload {
  schemaVersion?: string;
  generatedAt?: string;
  app?: string;
  keys?: Record<string, unknown>;
}

const SettingsView: React.FC = () => {
  const { truckSettings, setTruckSettings, setIsLocked, users, addUser, removeUser, currentUser } = useSettings();

  const [localSettings, setLocalSettings] = useState(truckSettings);
  const [newUser, setNewUser] = useState({ name: '', pin: '', role: 'STAFF' as 'STAFF' | 'MANAGER' });
  const [importStatus, setImportStatus] = useState<ImportStatus>(null);
  const [showResetGuard, setShowResetGuard] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const availableStorageKeys = useMemo(
    () => APP_STORAGE_KEYS.filter((key) => localStorage.getItem(key) !== null),
    []
  );

  const autoBackups = useMemo<AutoBackupEntry[]>(() => getAutoBackups(), []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setTruckSettings(localSettings);
    alert('Parametres mis a jour.');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.pin.length === 4) {
      addUser(newUser);
      setNewUser({ name: '', pin: '', role: 'STAFF' });
    }
  };

  const handleExportGlobalJSON = () => {
    const snapshot = buildGlobalBackupPayload({ reason: 'manual_export' });

    downloadJSON(snapshot, 'mollys_truck_backup_global');
  };

  const handleOpenImportPicker = () => {
    if (currentUser?.role !== 'MANAGER') {
      setImportStatus({ type: 'error', message: 'Import refuse: acces manager requis.' });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleSecureReset = () => {
    if (currentUser?.role !== 'MANAGER') {
      setImportStatus({ type: 'error', message: 'Reset refuse: acces manager requis.' });
      return;
    }

    if (resetToken !== 'RESET') {
      setImportStatus({ type: 'error', message: 'Reset refuse: token invalide (attendu: RESET).' });
      return;
    }

    const confirmed = window.confirm(
      "Confirmer le reset complet des donnees applicatives locales ? Cette action est irreversible."
    );
    if (!confirmed) return;

    const preResetBackup = buildGlobalBackupPayload({ reason: 'manual_reset_pre_clear' });
    saveAutoBackup(preResetBackup);

    APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(AUTO_BACKUPS_STORAGE_KEY, JSON.stringify([{
      ...preResetBackup,
      id: crypto.randomUUID(),
    }]));

    setImportStatus({ type: 'success', message: 'Reset effectue. Rechargement en cours...' });
    setResetToken('');
    setShowResetGuard(false);
    setTimeout(() => window.location.reload(), 900);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (currentUser?.role !== 'MANAGER') {
      setImportStatus({ type: 'error', message: 'Import refuse: acces manager requis.' });
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as BackupPayload;

      if (!parsed || typeof parsed !== 'object' || !parsed.keys || typeof parsed.keys !== 'object') {
        setImportStatus({ type: 'error', message: 'Format invalide: champ "keys" manquant.' });
        return;
      }

      const confirmed = window.confirm(
        'Importer ce backup va remplacer les donnees locales connues. Continuer ?'
      );
      if (!confirmed) return;

      let restoredCount = 0;
      APP_STORAGE_KEYS.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(parsed.keys, key)) return;
        const value = parsed.keys?.[key];
        if (typeof value === 'undefined') return;
        localStorage.setItem(key, JSON.stringify(value));
        restoredCount += 1;
      });

      setImportStatus({
        type: 'success',
        message: `Import termine: ${restoredCount} cle(s) restauree(s). Rechargement en cours...`,
      });
      setTimeout(() => window.location.reload(), 900);
    } catch {
      setImportStatus({ type: 'error', message: 'Import impossible: fichier JSON invalide.' });
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full scrollbar-hide">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Parametres</h1>
          <p className="text-gray-500 font-medium">Configurez votre truck, vos acces et vos donnees.</p>
        </div>
        <button
          onClick={() => setIsLocked(true)}
          className="bg-gray-100 text-gray-600 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-all"
        >
          <Lock size={20} /> Verrouiller l'app
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-pink-50 text-[#b3247e] rounded-2xl flex items-center justify-center">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Identite du Truck</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom Commercial</label>
                <input
                  type="text"
                  value={localSettings.name}
                  onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slogan / Message Ticket</label>
                <input
                  type="text"
                  value={localSettings.slogan}
                  onChange={(e) => setLocalSettings({ ...localSettings, slogan: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TVA Emporter (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localSettings.tvaEmporter}
                    onChange={(e) => setLocalSettings({ ...localSettings, tvaEmporter: parseFloat(e.target.value) })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TVA Sur Place (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localSettings.tvaPlace}
                    onChange={(e) => setLocalSettings({ ...localSettings, tvaPlace: parseFloat(e.target.value) })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#b3247e] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-pink-100 flex items-center justify-center gap-2 hover:bg-[#a11d6e] transition-all"
              >
                <Save size={20} /> Enregistrer les modifications
              </button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Data Management</h3>
            </div>

            <div className="space-y-5">
              <p className="text-sm text-gray-500 font-medium">
                Export global JSON de toutes les donnees locales pour sauvegarde externe.
              </p>
              <div className="bg-gray-50 rounded-2xl p-4 text-xs font-bold text-gray-500">
                Cles detectees: {availableStorageKeys.length} / {APP_STORAGE_KEYS.length}
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-xs font-bold text-gray-500">
                Backups auto detectes: {autoBackups.length}
              </div>
              <button
                onClick={handleExportGlobalJSON}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                <Download size={18} /> Exporter JSON Global
              </button>
              <button
                onClick={handleOpenImportPicker}
                className="w-full bg-slate-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <Upload size={18} /> Importer JSON Global
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
              <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Historique backups auto (5 derniers)</p>
                {autoBackups.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400">Aucun backup automatique detecte.</p>
                ) : (
                  autoBackups.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-xs font-black text-gray-700">{entry.reason}</p>
                        <p className="text-[10px] font-bold text-gray-400">{formatDate(entry.generatedAt, 'yyyy-MM-dd HH:mm:ss')}</p>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{entry.schemaVersion}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Zone sensible</p>
                {!showResetGuard ? (
                  <button
                    onClick={() => setShowResetGuard(true)}
                    className="w-full bg-red-600 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors"
                  >
                    Activer Reset Securise
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-red-600">Saisir <span className="font-black">RESET</span> pour confirmer.</p>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full p-3 rounded-xl border border-red-200 bg-white font-black text-sm outline-none"
                      placeholder="RESET"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setShowResetGuard(false);
                          setResetToken('');
                        }}
                        className="bg-white text-gray-700 py-3 rounded-xl font-black text-xs uppercase border border-gray-200"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSecureReset}
                        className="bg-red-700 text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-red-800"
                      >
                        Confirmer Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {importStatus && (
                <div
                  className={`rounded-2xl p-4 text-xs font-black ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {importStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Gestion de l'Equipe</h3>
            </div>

            <div className="space-y-4 mb-8">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-xs text-gray-400 shadow-sm uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800">{user.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {user.role} • PIN: {user.pin}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeUser(user.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddUser} className="p-6 bg-gray-50 rounded-3xl space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Ajouter un membre</h4>
              <div className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="Nom complet"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-4 bg-white rounded-2xl border-none outline-none font-bold text-sm"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    maxLength={4}
                    placeholder="Code PIN (4 chiffres)"
                    value={newUser.pin}
                    onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                    className="w-full p-4 bg-white rounded-2xl border-none outline-none font-bold text-sm"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'STAFF' | 'MANAGER' })}
                    className="w-full p-4 bg-white rounded-2xl border-none outline-none font-bold text-sm"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
                >
                  <UserPlus size={18} /> Ajouter a l'equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
