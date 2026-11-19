'use client';

import React, { useEffect } from 'react';
import { initializeSocket, disconnectSocket, SOCKET_EVENTS } from '@/lib/socket';
import { toast } from '@/lib/toast';
import { getAccessToken } from '@/lib/cookies';

interface NotificationPayload {
  title?: string;
  message?: string;
  post_id?: number | string;
}

interface ComplaintNewPayload {
  id: number | string;
  complaint_number?: string;
  title?: string;
  status?: string;
}

interface VisitorEntryPayload {
  visitor_id?: number | string;
  visitor_name?: string;
  action?: 'ENTRY' | 'EXIT';
  direction?: 'IN' | 'OUT';
  gate_name?: string;
  log_time?: string;
}

interface NoticeNewPayload {
  id?: number | string;
  title?: string;
  category?: string;
  priority?: string;
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket = initializeSocket(token);
    if (!socket) return;

    // 1. User Social & Interaction Notifications
    const handleNotificationNew = (data: NotificationPayload) => {
      if (data?.message) {
        toast.info(data.message, data.title || 'New Notification');
      }
    };

    // 2. New Maintenance Complaints Dispatched
    const handleComplaintNew = (data: ComplaintNewPayload) => {
      const cmpNo = data.complaint_number || `#${data.id}`;
      const title = data.title ? `: ${data.title}` : '';
      toast.warn(`Complaint ${cmpNo}${title}`, 'New Maintenance Complaint');
    };

    // 3. Visitor Gate Check-in & Check-out Alerts
    const handleVisitorEntry = (data: VisitorEntryPayload) => {
      const visitorName = data.visitor_name || 'Visitor';
      const gate = data.gate_name ? ` at ${data.gate_name}` : '';
      if (data.action === 'ENTRY' || data.direction === 'IN') {
        toast.info(`${visitorName} checked in${gate}`, 'Visitor Gate Entry');
      } else {
        toast.info(`${visitorName} checked out${gate}`, 'Visitor Gate Exit');
      }
    };

    // 4. Property Broadcasts & Notices
    const handleNoticeNew = (data: NoticeNewPayload) => {
      if (data?.title) {
        toast.info(data.title, 'New Notice Published');
      }
    };

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNotificationNew);
    socket.on(SOCKET_EVENTS.COMPLAINT_NEW, handleComplaintNew);
    socket.on(SOCKET_EVENTS.VISITOR_ENTRY, handleVisitorEntry);
    socket.on(SOCKET_EVENTS.NOTICE_NEW, handleNoticeNew);

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNotificationNew);
      socket.off(SOCKET_EVENTS.COMPLAINT_NEW, handleComplaintNew);
      socket.off(SOCKET_EVENTS.VISITOR_ENTRY, handleVisitorEntry);
      socket.off(SOCKET_EVENTS.NOTICE_NEW, handleNoticeNew);
      disconnectSocket();
    };
  }, []);

  return <>{children}</>;
};
