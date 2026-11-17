'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { LaundryCatalogItem } from '@/types/laundry';
import { laundryService } from '@/services/laundry.service';
import { branchService } from '@/services/branch.service';
import { Branch } from '@/types/branch';
import { Dropdown } from '@/components/ui';

interface LaundryCatalogModalProps {
  visible: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

export const LaundryCatalogModal: React.FC<LaundryCatalogModalProps> = ({
  visible,
  onHide,
  onSuccess,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [applyToAll, setApplyToAll] = useState<boolean>(true);
  const [pickupSlot, setPickupSlot] = useState<string>('09:00 AM - 11:00 AM');
  const [items, setItems] = useState<LaundryCatalogItem[]>([
    { name: 'Shirt', rate: 25 },
    { name: 'T-Shirt', rate: 20 },
    { name: 'Jeans', rate: 35 },
    { name: 'Towel', rate: 45 },
    { name: 'Other', rate: 25 },
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRate, setNewItemRate] = useState('');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      branchService
        .getBranches({ limit: 100 })
        .then((res) => setBranches(res.data || []))
        .catch((err) => console.warn('Failed to load branches:', err));
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    const branchParam = selectedBranchId === 'all' ? undefined : selectedBranchId;
    laundryService
      .getCatalog(branchParam)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          if (data.pickup_time_slot) setPickupSlot(data.pickup_time_slot);
          if (Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items);
          }
        }
      })
      .catch((err) => console.warn('Failed to load catalog:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, selectedBranchId]);

  const handleRateChange = (index: number, newRate: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, rate: Math.max(0, newRate) } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemRate) return;
    setItems((prev) => [...prev, { name: newItemName.trim(), rate: Number(newItemRate) || 0 }]);
    setNewItemName('');
    setNewItemRate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || items.length === 0) return;

    try {
      setIsSubmitting(true);
      const branchIdNum = selectedBranchId === 'all' ? null : Number(selectedBranchId);
      await laundryService.updateCatalog({
        branch_id: branchIdNum,
        apply_to_all_branches: applyToAll,
        pickup_time_slot: pickupSlot.trim(),
        service_types: ['Wash & Fold', 'Dry Cleaning'],
        items: items.map((it) => ({
          name: it.name.trim(),
          rate: Number(it.rate) || 0,
        })),
        important_notes: [
          'Pickup will be done from your room',
          'Laundry will be returned within 2-3 days',
          'For delicate items, please specify in notes.',
        ],
      });
      if (onSuccess) onSuccess();
      onHide();
    } catch {
      // apiClient handles backend errors
    } finally {
      setIsSubmitting(false);
    }
  };

  const branchOptions = [
    { label: 'All Branches (Default Pricing)', value: 'all' },
    ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
  ];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-0 font-sans"
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#175C46] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Laundry Catalog & Pricing
            </h2>
            <p className="text-xs text-gray-500 font-normal">
              Manage per-item rates and pickup slots for branches.
            </p>
          </div>
        </div>
      }
      contentClassName="p-5 sm:p-6 bg-white space-y-4 max-h-[75vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Branch Filter & Scope */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Branch
            </label>
            <Dropdown
              options={branchOptions}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Pickup Slot
            </label>
            <input
              type="text"
              value={pickupSlot}
              onChange={(e) => setPickupSlot(e.target.value)}
              placeholder="e.g. 09:00 AM - 11:00 AM (Mon - Sat)"
              className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#175C46]/20 focus:border-[#175C46] transition-all"
            />
          </div>
        </div>

        {/* Apply to All Branches Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="w-4 h-4 rounded text-[#175C46] focus:ring-[#175C46]"
          />
          <span className="text-xs font-medium text-gray-700">
            Apply these rates to all PG branches
          </span>
        </label>

        {/* Catalog Items Rates Table */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Laundry Items & Rates (₹)
          </label>
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {items.map((it, idx) => (
              <div
                key={`${it.name}-${idx}`}
                className="flex items-center justify-between p-3 bg-white hover:bg-gray-50/50 transition-colors gap-3"
              >
                <span className="text-xs sm:text-sm font-semibold text-gray-900 min-w-0 truncate">
                  {it.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={it.rate}
                    onChange={(e) => handleRateChange(idx, Number(e.target.value) || 0)}
                    className="w-20 h-9 px-2 text-center text-xs sm:text-sm font-bold text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#175C46] focus:border-[#175C46]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    title="Remove item"
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Item */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="New item (e.g. Bedsheet, Blanket)"
            className="flex-1 h-9 px-3 text-xs bg-white rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#175C46] w-full"
          />
          <input
            type="number"
            min="0"
            value={newItemRate}
            onChange={(e) => setNewItemRate(e.target.value)}
            placeholder="Rate (₹)"
            className="w-full sm:w-24 h-9 px-3 text-xs bg-white rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#175C46]"
          />
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!newItemName.trim() || !newItemRate}
            className="w-full sm:w-auto h-9 px-4 text-xs font-semibold text-[#175C46] bg-white border border-[#175C46]/30 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            Add Item
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onHide}
            className="h-10 px-4 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="h-10 px-5 text-xs font-semibold text-white bg-[#175C46] hover:bg-[#124b38] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Save Catalog & Rates'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
