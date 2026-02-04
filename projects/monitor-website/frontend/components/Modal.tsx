'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full mx-4 bg-card rounded-xl border border-border shadow-2xl',
          sizeConfig[size]
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface WebsiteFormData {
  name: string;
  url: string;
  isActive: boolean;
  notificationsEnabled: boolean;
  telegramChatId: string;
}

interface WebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WebsiteFormData) => void;
  initialData?: Partial<WebsiteFormData>;
  mode: 'create' | 'edit';
}

export function WebsiteModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: WebsiteModalProps) {
  const [formData, setFormData] = useState<WebsiteFormData>({
    name: initialData?.name || '',
    url: initialData?.url || '',
    isActive: initialData?.isActive ?? true,
    notificationsEnabled: initialData?.notificationsEnabled ?? true,
    telegramChatId: initialData?.telegramChatId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add New Website' : 'Edit Website'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Website Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g., Google"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            URL
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="https://example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Telegram Chat ID (optional)
          </label>
          <input
            type="text"
            value={formData.telegramChatId}
            onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g., 123456789 or @channelusername"
          />
          <p className="text-xs text-muted mt-1">
            Enter your Telegram Chat ID to receive notifications
          </p>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-border bg-background text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-white">Active</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.notificationsEnabled}
              onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
              className="w-5 h-5 rounded border-border bg-background text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-white">Notifications</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            {mode === 'create' ? 'Add Website' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
