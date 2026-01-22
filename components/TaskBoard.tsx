
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, TaskStatus, TaskComplexity, Attachment } from '../types';
import { Clock, CheckCircle2, PlayCircle, Plus, Edit2, Trash2, Search, X, Check, Paperclip, FileText, Image as ImageIcon, Eye, AlertTriangle, Calendar } from 'lucide-react';

const pad = (n: number) => n.toString().padStart(2, '0');

const formatExplicit = (ts: number | undefined) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const SmartDateTimeInput: React.FC<{
  label: string;
  value: string; // YYYY-MM-DDTHH:mm:ss
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T');
      const [y, m, d] = datePart.split('-');
      const timeElements = timePart.split(':');
      const timeStr = timeElements.length === 2 ? `${timePart}:00` : timePart;
      setDisplayText(`${d}/${m}/${y} ${timeStr}`);
    } else {
      setDisplayText('');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 14) raw = raw.slice(0, 14);

    let formatted = raw;
    if (raw.length >= 3 && raw.length <= 4) formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    else if (raw.length >= 5 && raw.length <= 8) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    else if (raw.length >= 9 && raw.length <= 10) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)} ${raw.slice(8)}`;
    else if (raw.length >= 11 && raw.length <= 12) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)} ${raw.slice(8, 10)}:${raw.slice(10)}`;
    else if (raw.length >= 13) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)} ${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12)}`;

    