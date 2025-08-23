'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBudget } from '@/lib/context/budget-context';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { Bucket } from './Bucket/Bucket';
import { CompactGoals } from './CompactGoals';
import { StagingTray } from '../trays/StagingTray';
import { Chip } from '../inputs/Chip';
import { Chip as ChipType, Bucket as BucketType } from '@/lib/types';

export function BudgetDrop() {
  const { state, dropChip } = useBudget();
  const [activeChip, setActiveChip] = useState<ChipType | null>(null);
  const [layoutMode, setLayoutMode] = useState<'individual' | 'compact'>('individual');



  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'chip') {
      const chip = active.data.current.chip as ChipType;
      setActiveChip(chip);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveChip(null);

    if (!over || !active.data.current?.chip) return;

    const chip = active.data.current.chip as ChipType;
    const overId = over.id as string;

    // Check if dropped on a bucket (handle both regular and compact IDs)
    const bucketId = overId.startsWith('compact-') ? overId.replace('compact-', '') : overId;
    const bucket = state.buckets.find((b: BucketType) => b.id === bucketId);
    if (bucket) {
      dropChip(chip.id, bucket.id);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-terminal)] crt-scanlines">
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-[var(--bg-terminal)]">
            <Header 
              layoutMode={layoutMode}
              onLayoutModeChange={setLayoutMode}
            />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6 pb-20">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Staging Tray - moved to top */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <StagingTray />
              </motion.section>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="border-b border-[var(--text-primary)] opacity-30"
              />

              {/* Goals Display */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {layoutMode === 'compact' ? (
                  <CompactGoals activeChip={activeChip} />
                ) : (
                  <div className="space-y-4">
                    {state.buckets.map((bucket: BucketType, index: number) => (
                      <motion.div
                        key={bucket.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      >
                        <Bucket bucket={bucket} activeChip={activeChip} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            </div>
          </main>

          {/* Footer */}
          <div className="sticky bottom-0 z-40 bg-[var(--bg-terminal)]">
            <Footer />
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeChip ? (
            <div className="transform rotate-12 scale-110 opacity-90">
              <Chip chip={activeChip} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 