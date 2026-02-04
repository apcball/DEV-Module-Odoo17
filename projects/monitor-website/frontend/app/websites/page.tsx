'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Website } from '@/types';
import { WebsiteTable } from '@/components/WebsiteTable';
import { WebsiteModal } from '@/components/Modal';
import { Plus } from 'lucide-react';
import { formatUptime } from '@/lib/utils';

// Mock data
const mockWebsites: Website[] = [
  { id: '1', name: 'Google', url: 'https://google.com', status: 'up', uptime24h: 99.99, uptime7d: 99.95, uptime30d: 99.98, responseTime: 120, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '2', name: 'GitHub', url: 'https://github.com', status: 'up', uptime24h: 99.95, uptime7d: 99.90, uptime30d: 99.92, responseTime: 250, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '3', name: 'AWS', url: 'https://aws.amazon.com', status: 'unknown', uptime24h: 98.50, uptime7d: 99.20, uptime30d: 99.50, responseTime: 800, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '4', name: 'Example Site', url: 'https://example.com', status: 'down', uptime24h: 95.00, uptime7d: 97.50, uptime30d: 98.00, responseTime: 0, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: false },
  { id: '5', name: 'Vercel', url: 'https://vercel.com', status: 'up', uptime24h: 99.99, uptime7d: 99.98, uptime30d: 99.99, responseTime: 180, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '6', name: 'Stripe', url: 'https://stripe.com', status: 'up', uptime24h: 99.98, uptime7d: 99.95, uptime30d: 99.97, responseTime: 200, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '7', name: 'Slack', url: 'https://slack.com', status: 'up', uptime24h: 99.90, uptime7d: 99.85, uptime30d: 99.88, responseTime: 300, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '8', name: 'Discord', url: 'https://discord.com', status: 'up', uptime24h: 99.95, uptime7d: 99.90, uptime30d: 99.93, responseTime: 220, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '9', name: 'Twitter', url: 'https://twitter.com', status: 'unknown', uptime24h: 97.00, uptime7d: 98.50, uptime30d: 98.80, responseTime: 1200, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
  { id: '10', name: 'Netlify', url: 'https://netlify.com', status: 'up', uptime24h: 99.98, uptime7d: 99.95, uptime30d: 99.96, responseTime: 150, lastChecked: new Date().toISOString(), isActive: true, notificationsEnabled: true },
];

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingWebsite, setDeletingWebsite] = useState<Website | null>(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const data = await api.getAllWebsites();
      setWebsites(data);
    } catch (error) {
      console.log('Using mock data');
      setWebsites(mockWebsites);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (formData: { name: string; url: string; isActive: boolean; notificationsEnabled: boolean; telegramChatId: string }) => {
    try {
      await api.createWebsite({
        name: formData.name,
        url: formData.url,
        isActive: formData.isActive,
        notificationsEnabled: formData.notificationsEnabled,
        telegramChatId: formData.telegramChatId || undefined,
      });
      fetchWebsites();
    } catch (error) {
      // Add to mock data
      const newWebsite: Website = {
        id: Date.now().toString(),
        name: formData.name,
        url: formData.url,
        isActive: formData.isActive,
        notificationsEnabled: formData.notificationsEnabled,
        telegramChatId: formData.telegramChatId || undefined,
        status: 'up',
        uptime24h: 100,
        uptime7d: 100,
        uptime30d: 100,
        responseTime: 0,
        lastChecked: new Date().toISOString(),
      };
      setWebsites([...websites, newWebsite]);
    }
  };

  const handleEdit = async (formData: { name: string; url: string; isActive: boolean; notificationsEnabled: boolean; telegramChatId: string }) => {
    if (!editingWebsite) return;
    try {
      await api.updateWebsite(editingWebsite.id, {
        name: formData.name,
        url: formData.url,
        isActive: formData.isActive,
        notificationsEnabled: formData.notificationsEnabled,
        telegramChatId: formData.telegramChatId || undefined,
      });
      fetchWebsites();
    } catch (error) {
      setWebsites(websites.map(w =>
        w.id === editingWebsite.id ? { ...w, ...formData } : w
      ));
    }
    setEditingWebsite(null);
  };

  const handleDelete = async () => {
    if (!deletingWebsite) return;
    try {
      await api.deleteWebsite(deletingWebsite.id);
      fetchWebsites();
    } catch (error) {
      setWebsites(websites.filter(w => w.id !== deletingWebsite.id));
    }
    setDeletingWebsite(null);
    setIsDeleteModalOpen(false);
  };

  const handleToggleActive = async (website: Website) => {
    try {
      await api.updateWebsite(website.id, { isActive: !website.isActive });
      fetchWebsites();
    } catch (error) {
      setWebsites(websites.map(w =>
        w.id === website.id ? { ...w, isActive: !w.isActive } : w
      ));
    }
  };

  const handleToggleNotifications = async (website: Website) => {
    try {
      await api.updateWebsite(website.id, { notificationsEnabled: !website.notificationsEnabled });
      fetchWebsites();
    } catch (error) {
      setWebsites(websites.map(w =>
        w.id === website.id ? { ...w, notificationsEnabled: !w.notificationsEnabled } : w
      ));
    }
  };

  const openEditModal = (website: Website) => {
    setEditingWebsite(website);
    setIsModalOpen(true);
  };

  const openDeleteModal = (website: Website) => {
    setDeletingWebsite(website);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Websites</h1>
          <p className="text-muted mt-1">Manage your monitored websites</p>
        </div>
        <button
          onClick={() => {
            setEditingWebsite(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Website
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted text-sm">Total Websites</p>
          <p className="text-2xl font-bold text-white mt-1">{websites.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted text-sm">Active</p>
          <p className="text-2xl font-bold text-online mt-1">{websites.filter(w => w.isActive).length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted text-sm">Notifications Enabled</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{websites.filter(w => w.notificationsEnabled).length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-muted text-sm">Avg Uptime (24h)</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatUptime(websites.reduce((acc, w) => acc + w.uptime24h, 0) / websites.length)}
          </p>
        </div>
      </div>

      {/* Websites Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <WebsiteTable
          websites={websites}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onToggleActive={handleToggleActive}
          onToggleNotifications={handleToggleNotifications}
        />
      </div>

      {/* Add/Edit Modal */}
      <WebsiteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWebsite(null);
        }}
        onSubmit={editingWebsite ? handleEdit : handleAdd}
        initialData={editingWebsite || undefined}
        mode={editingWebsite ? 'edit' : 'create'}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md mx-4 bg-card rounded-xl border border-border shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Delete Website</h2>
            <p className="text-muted mb-6">
              Are you sure you want to delete "{deletingWebsite?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-offline text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
