import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Server,
  Database,
  Cloud,
  FileText,
  ArrowRight,
  Unlink,
  Link2,
  Upload,
  Search,
  ChevronDown,
  HelpCircle,
  ExternalLink,
  Info,
  Check,
  RotateCcw,
  Globe,
  Activity,
  HardDrive,
  Plus,
  X,
  Send,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SQL_TABLE_OPTIONS } from '../../data/mockData';
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

const sqlFormSchema = z.object({
  engine: z.string().min(1),
  host: z.string().min(1, 'Host is required'),
  port: z.string().regex(/^\d*$/, 'Port must be numeric').optional(),
  dbName: z.string().min(1, 'Database name is required'),
  username: z.string().optional(),
  password: z.string().optional(),
});

const ALL_PLATFORMS_MAP = {
  erp: [
    'SAP S/4HANA',
    'SAP ECC',
    'Oracle NetSuite',
    'Microsoft Dynamics 365',
    'Workday Supply Chain',
    'Infor M3 / CloudSuite',
    'Epicor Kinetic',
    'Sage Intacct',
  ],
  sql: [
    'PostgreSQL',
    'MySQL',
    'Microsoft SQL Server',
    'Oracle Database',
    'MariaDB',
    'Amazon Aurora',
    'CockroachDB',
    'SQLite',
  ],
  warehouse: [
    'Snowflake',
    'Google BigQuery',
    'Amazon Redshift',
    'Databricks Lakehouse',
    'ClickHouse',
    'SingleStore',
    'Firebolt',
  ],
  file: [
    'CSV (.csv)',
    'Microsoft Excel (.xlsx, .xls)',
    'Apache Parquet (.parquet)',
    'JSON / NDJSON',
    'TSV (.tsv)',
    'XML',
    'Apache ORC',
  ],
  rest: [
    'OpenAPI 3.0 / Swagger',
    'GraphQL Endpoint',
    'Custom Webhooks (JSON)',
    'Postman Collection',
    'gRPC Gateway',
  ],
  streaming: [
    'Apache Kafka',
    'AWS Kinesis Data Streams',
    'RabbitMQ',
    'Google Cloud Pub/Sub',
    'Azure Event Hubs',
    'Redis Streams',
  ],
  storage: [
    'Amazon S3 Buckets',
    'Azure Blob Storage',
    'Google Cloud Storage (GCS)',
    'MinIO Object Store',
    'Cloudflare R2',
  ],
};

const CONNECTORS_CONFIG = [
  {
    id: 'erp',
    title: 'ERP System',
    desc: 'Connect your ERP to sync inventory, demand and supply data.',
    categories: ['ERP'],
    platforms: ['SAP S/4HANA', 'Oracle NetSuite', 'Microsoft Dynamics', '+ More'],
    sectionLabel: 'SUPPORTED PLATFORMS',
    theme: {
      iconBg: 'bg-[#E0F2FE]',
      iconBorder: 'border-[#BAE6FD]',
      iconColor: 'text-[#0284C7]',
      btnBorder: 'border-[#0284C7]',
      btnText: 'text-[#0284C7]',
      btnHover: 'hover:bg-[#F0F9FF]',
    },
    icon: Server,
    ctaText: 'Connect ERP',
  },
  {
    id: 'sql',
    title: 'SQL Database',
    desc: 'Connect to your database for direct data access and real-time insights.',
    categories: ['Database', 'Cloud'],
    platforms: ['PostgreSQL', 'MySQL', 'SQL Server', '+ More'],
    sectionLabel: 'SUPPORTED PLATFORMS',
    theme: {
      iconBg: 'bg-[#CCFBF1]',
      iconBorder: 'border-[#99F6E4]',
      iconColor: 'text-[#0D9488]',
      btnBorder: 'border-[#0D9488]',
      btnText: 'text-[#0D9488]',
      btnHover: 'hover:bg-[#F0FDF4]',
    },
    icon: Database,
    ctaText: 'Connect Database',
  },
  {
    id: 'warehouse',
    title: 'Data Warehouse',
    desc: 'Access data from your cloud warehouse for unified inventory analysis.',
    categories: ['Data Warehouse', 'Cloud', 'Database'],
    platforms: ['Snowflake', 'BigQuery', 'Redshift', '+ More'],
    sectionLabel: 'SUPPORTED PLATFORMS',
    theme: {
      iconBg: 'bg-[#F3E8FF]',
      iconBorder: 'border-[#DDD6FE]',
      iconColor: 'text-[#7C3AED]',
      btnBorder: 'border-[#7C3AED]',
      btnText: 'text-[#7C3AED]',
      btnHover: 'hover:bg-[#FAF5FF]',
    },
    icon: Cloud,
    ctaText: 'Connect Warehouse',
  },
  {
    id: 'file',
    title: 'File Upload',
    desc: 'Upload a CSV or Excel file for a one-time or scheduled data load.',
    categories: ['File'],
    platforms: ['CSV', 'Excel (XLSX)', 'Parquet', '+ More'],
    sectionLabel: 'SUPPORTED FORMATS',
    theme: {
      iconBg: 'bg-[#FFEDD5]',
      iconBorder: 'border-[#FED7AA]',
      iconColor: 'text-[#EA580C]',
      btnBorder: 'border-[#EA580C]',
      btnText: 'text-[#EA580C]',
      btnHover: 'hover:bg-[#FFF7ED]',
    },
    icon: FileText,
    ctaText: 'Upload File',
  },
  {
    id: 'rest',
    title: 'REST API & Webhooks',
    desc: 'Connect custom enterprise endpoints via OpenAPI, JSON webhooks or GraphQL.',
    categories: ['REST API', 'Cloud', 'More'],
    platforms: ['OpenAPI 3.0', 'GraphQL', 'Webhooks', '+ More'],
    sectionLabel: 'SUPPORTED PROTOCOLS',
    theme: {
      iconBg: 'bg-[#E0E7FF]',
      iconBorder: 'border-[#C7D2FE]',
      iconColor: 'text-[#4F46E5]',
      btnBorder: 'border-[#4F46E5]',
      btnText: 'text-[#4F46E5]',
      btnHover: 'hover:bg-[#EEF2FF]',
    },
    icon: Globe,
    ctaText: 'Configure REST API',
  },
  {
    id: 'streaming',
    title: 'Streaming & Kafka',
    desc: 'Stream high-frequency inventory telemetry and real-time movement events.',
    categories: ['Streaming', 'Cloud', 'More'],
    platforms: ['Apache Kafka', 'AWS Kinesis', 'RabbitMQ', '+ More'],
    sectionLabel: 'STREAM ENGINES',
    theme: {
      iconBg: 'bg-[#DCFCE7]',
      iconBorder: 'border-[#BBF7D0]',
      iconColor: 'text-[#16A34A]',
      btnBorder: 'border-[#16A34A]',
      btnText: 'text-[#16A34A]',
      btnHover: 'hover:bg-[#F0FDF4]',
    },
    icon: Activity,
    ctaText: 'Connect Stream',
  },
  {
    id: 'storage',
    title: 'Cloud Storage',
    desc: 'Ingest raw batch snapshots directly from enterprise cloud storage buckets.',
    categories: ['Storage', 'Cloud', 'File', 'More'],
    platforms: ['Amazon S3', 'Azure Blob', 'Google GCS', '+ More'],
    sectionLabel: 'STORAGE PROVIDERS',
    theme: {
      iconBg: 'bg-[#FEF3C7]',
      iconBorder: 'border-[#FDE68A]',
      iconColor: 'text-[#D97706]',
      btnBorder: 'border-[#D97706]',
      btnText: 'text-[#D97706]',
      btnHover: 'hover:bg-[#FFFBEB]',
    },
    icon: HardDrive,
    ctaText: 'Mount Bucket',
  },
];

const MORE_CATEGORIES = [
  {
    id: 'REST API',
    label: 'REST API & Webhooks',
    desc: 'Sync HTTP endpoints, OpenAPI 3.0, GraphQL',
    icon: Globe,
    badge: 'API',
  },
  {
    id: 'Streaming',
    label: 'Streaming & Events',
    desc: 'Apache Kafka, AWS Kinesis, RabbitMQ',
    icon: Activity,
    badge: 'Live',
  },
  {
    id: 'Storage',
    label: 'Cloud Object Storage',
    desc: 'Amazon S3, Azure Blob, Google Cloud Storage',
    icon: HardDrive,
    badge: 'Bucket',
  },
];

export default function DataSourceConnections() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const moreDropdownRef = useRef(null);

  // Platform list modal state
  const [platformModalData, setPlatformModalData] = useState(null);

  // Request Connector Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    systemName: '',
    category: 'ERP',
    email: 'alex.vance@enterprise.com',
    notes: '',
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Connector States
  const [erpConnected, setErpConnected] = useState(false);
  const [whConnected, setWhConnected] = useState(false);
  const [fileConnected, setFileConnected] = useState(false);
  const [restConnected, setRestConnected] = useState(false);
  const [streamingConnected, setStreamingConnected] = useState(false);
  const [storageConnected, setStorageConnected] = useState(false);

  // SQL Connector State & Modal
  const [sqlDialogOpen, setSqlDialogOpen] = useState(false);
  const [sqlConnected, setSqlConnected] = useState(false);
  const [sqlConnStr, setSqlConnStr] = useState('');
  const [tableMappings, setTableMappings] = useState({
    inventory: SQL_TABLE_OPTIONS.inventory[0],
    transactions: SQL_TABLE_OPTIONS.transactions[0],
    bom: SQL_TABLE_OPTIONS.bom[0],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sqlFormSchema),
    defaultValues: {
      engine: 'PostgreSQL',
      host: 'db.inventory.internal',
      port: '5432',
      dbName: 'inventory_prod_v2',
      username: 'svc_aitek_ro',
      password: '••••••••••••',
    },
  });

  const engineValue = watch('engine');

  const onSqlConnectSubmit = (data) => {
    const scheme =
      data.engine === 'PostgreSQL' ? 'postgresql' : data.engine === 'MySQL' ? 'mysql' : 'sqlserver';
    const finalConnStr = `${scheme}://${data.host}:${data.port || '5432'}/${data.dbName}`;
    setSqlConnStr(finalConnStr);
    setSqlConnected(true);
    setSqlDialogOpen(false);
    toast.success('SQL Database Connected Successfully', {
      description: `Targeting: ${finalConnStr}`,
    });
  };

  const handleSqlDisconnect = () => {
    setSqlConnected(false);
    toast.info('SQL Database Disconnected');
  };

  const toggleErpConnection = () => {
    const nextState = !erpConnected;
    setErpConnected(nextState);
    if (nextState) {
      toast.success('Connected to ERP System', {
        description: 'SAP S/4HANA / Enterprise ERP live pipeline established.',
      });
    } else {
      toast.info('Disconnected ERP System');
    }
  };

  const toggleWhConnection = () => {
    const nextState = !whConnected;
    setWhConnected(nextState);
    if (nextState) {
      toast.success('Connected to Data Warehouse', {
        description: 'Cloud data warehouse snapshot synchronized.',
      });
    } else {
      toast.info('Disconnected Data Warehouse');
    }
  };

  const toggleFileConnection = () => {
    const nextState = !fileConnected;
    setFileConnected(nextState);
    if (nextState) {
      toast.success('File Upload Ingested', {
        description: 'Inventory extract parsed and staged for analysis.',
      });
    } else {
      toast.info('File connection reset');
    }
  };

  const toggleRestConnection = () => {
    const nextState = !restConnected;
    setRestConnected(nextState);
    if (nextState) {
      toast.success('REST API / Webhook Pipeline Connected', {
        description: 'Real-time JSON synchronization active.',
      });
    } else {
      toast.info('Disconnected REST API');
    }
  };

  const toggleStreamingConnection = () => {
    const nextState = !streamingConnected;
    setStreamingConnected(nextState);
    if (nextState) {
      toast.success('Connected to Streaming Pipeline', {
        description: 'Apache Kafka consumer group subscribed to inventory topic.',
      });
    } else {
      toast.info('Disconnected Streaming Pipeline');
    }
  };

  const toggleStorageConnection = () => {
    const nextState = !storageConnected;
    setStorageConnected(nextState);
    if (nextState) {
      toast.success('Cloud Object Storage Mounted', {
        description: 'Amazon S3 / Azure Blob bucket synced.',
      });
    } else {
      toast.info('Disconnected Cloud Storage');
    }
  };

  const handleRequestFormSubmit = (e) => {
    e.preventDefault();
    setRequestModalOpen(false);
    toast.success('Connector Request Submitted!', {
      description: `We received your request for "${requestFormData.systemName || 'Enterprise System'}". Our team will follow up at ${requestFormData.email}.`,
    });
    setRequestFormData({
      systemName: '',
      category: 'ERP',
      email: 'alex.vance@enterprise.com',
      notes: '',
    });
  };

  const filterList = ['All', 'ERP', 'Database', 'Data Warehouse', 'File', 'Cloud'];
  const isMoreFilterActive = MORE_CATEGORIES.some((c) => c.id === activeFilter);

  // Reactive filtering
  const filteredConnectors = CONNECTORS_CONFIG.filter((c) => {
    const q = searchQuery.toLowerCase().trim();

    // If searching, search across all connectors regardless of active category filter if user cleared filter
    if (q) {
      const matchesSearch =
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.platforms.some((p) => p.toLowerCase().includes(q)) ||
        c.categories.some((cat) => cat.toLowerCase().includes(q));

      if (activeFilter === 'All') return matchesSearch;
      return matchesSearch && c.categories.includes(activeFilter);
    }

    // When default 'All' with no search, show the standard 4 primary cards for 16:9 desktop balance
    if (activeFilter === 'All') {
      return ['erp', 'sql', 'warehouse', 'file'].includes(c.id);
    }

    return c.categories.includes(activeFilter);
  });

  return (
    <div
      className="h-screen max-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-[#F8FAFC] select-none text-[#0F172A]"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ========================================================================= */}
      {/* BACKGROUND AMBIENT DECORATION                                             */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[15%] -left-[10%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.04) 0%, rgba(224, 242, 254, 0.02) 60%, transparent 80%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute -bottom-[15%] -right-[10%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, rgba(240, 249, 255, 0.02) 60%, transparent 80%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. ENTERPRISE HEADER (Clean, well-spaced white bar)                       */}
      {/* ========================================================================= */}
      <header className="h-16 sm:h-[68px] bg-white border-b border-[#E2E8F0] px-6 sm:px-10 lg:px-14 xl:px-16 flex items-center justify-between z-20 relative shrink-0">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <img
            src={aitekLogo}
            alt="AITEK Logo"
            className="h-[44px] sm:h-[48px] w-auto object-contain"
          />
          <span className="text-[22px] sm:text-[25px] font-extrabold text-[#0B1727] tracking-tight leading-none">
            AITEK
          </span>
          <span className="text-[#CBD5E1] mx-1 text-lg font-light">|</span>
          <span className="text-[14px] sm:text-[15px] font-semibold text-[#0284C7] tracking-tight">
            Inventory Modelling
          </span>
        </div>

        {/* Right: User Profile & Help */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              AV
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[12.5px] font-bold text-[#0B1727] leading-tight group-hover:text-[#0284C7] transition-colors">
                Alex Vance
              </span>
              <span className="text-[10.5px] text-[#64748B] leading-tight">
                Enterprise Corp
              </span>
            </div>
            <ChevronDown size={13} className="text-[#64748B] group-hover:text-[#0B1727] transition-colors hidden sm:block" />
          </div>

          <div className="w-[1px] h-5 bg-[#E2E8F0]" />

          <button
            type="button"
            onClick={() => toast.info('AITEK Platform Help Center & Knowledge Base')}
            className="w-7 h-7 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#0B1727] hover:bg-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Help & Documentation"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TWO-STEP PROGRESS BAR                                                  */}
      {/* ========================================================================= */}
      <div className="w-full bg-white border-b border-[#E2E8F0]/80 py-2.5 px-6 sm:px-10 lg:px-14 shrink-0 relative z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Step 1: Material Selection (Completed) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
              <Check size={11} strokeWidth={3} />
            </div>
            <span className="text-[12px] font-semibold text-[#0B1727]">
              1. Material Selection
            </span>
          </div>

          {/* Line 1 (Active) */}
          <div className="flex-1 h-[2px] bg-[#0284C7] mx-4 rounded-full" />

          {/* Step 2: Data Sources (Active) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-[10px] font-bold ring-3 ring-[#E0F2FE] shadow-2xs">
              2
            </div>
            <span className="text-[12px] font-bold text-[#0B1727]">
              2. Data Sources
            </span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT CONTAINER (Zero Scroll Budget)                            */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full max-w-[1660px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-18 py-3 sm:py-3.5 relative z-10 flex flex-col justify-between overflow-hidden my-auto">
        <div>
          
          {/* Header Introduction */}
          <div className="mb-2.5">
            <div className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider mb-0.5">
              DATA SOURCES
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#0B1727] tracking-tight leading-tight mb-1">
              Connect your data sources
            </h1>
            <p className="text-[13px] sm:text-[13.5px] text-[#5B6B82] leading-snug max-w-3xl font-normal">
              Bring your inventory data from across your enterprise. Connect one or more data sources
              to build a comprehensive and accurate inventory model.
            </p>
          </div>

          {/* Search + Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3">
            {/* Search Box */}
            <div className="relative w-full max-w-[500px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search data sources (e.g., SAP, Snowflake, SQL, Kafka, S3)"
                className="w-full h-[36px] pl-9 pr-3.5 rounded-lg border border-[#CBD5E1] bg-white text-[12.5px] text-[#0B1727] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#0284C7] focus:ring-2 focus:ring-[#E0F2FE]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0B1727] p-0.5 rounded cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterList.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-full text-[11.5px] font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0284C7] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E8F0] text-[#0B1727] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}

              {/* Enhanced 'More' Popover Menu */}
              <div className="relative" ref={moreDropdownRef}>
                <button
                  type="button"
                  onClick={() => setMoreDropdownOpen((prev) => !prev)}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                    isMoreFilterActive || moreDropdownOpen
                      ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-2xs'
                      : 'bg-white border-[#E2E8F0] text-[#0B1727] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{isMoreFilterActive ? activeFilter : 'More'}</span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform ${moreDropdownOpen ? 'rotate-180' : ''} ${
                      isMoreFilterActive || moreDropdownOpen ? 'text-white' : 'text-[#64748B]'
                    }`}
                  />
                </button>

                {/* In-place Dropdown Popup */}
                {moreDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-[0_12px_36px_rgba(15,23,42,0.16)] border border-[#E2E8F0] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center justify-between border-b border-[#F1F5F9] pb-1.5 mb-1">
                      <span>Additional Categories</span>
                      <span className="text-[9.5px] font-semibold text-[#0284C7] bg-[#E0F2FE] px-1.5 py-0.2 rounded">
                        3 Filters
                      </span>
                    </div>

                    <div className="px-1.5 space-y-0.5">
                      {MORE_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isCatActive = activeFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setActiveFilter(cat.id);
                              setMoreDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between group cursor-pointer ${
                              isCatActive ? 'bg-[#E0F2FE] text-[#0284C7]' : 'hover:bg-[#F8FAFC] text-[#0B1727]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                                  isCatActive
                                    ? 'bg-[#0284C7] text-white border-[#0284C7]'
                                    : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] group-hover:text-[#0284C7] group-hover:bg-[#E0F2FE]'
                                }`}
                              >
                                <Icon size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[12px] font-bold leading-tight">
                                  {cat.label}
                                </span>
                                <span className="text-[10px] text-[#64748B] leading-tight">
                                  {cat.desc}
                                </span>
                              </div>
                            </div>
                            {isCatActive && <Check size={13} className="text-[#0284C7] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Action inside Popover */}
                    <div className="mt-1 pt-1.5 border-t border-[#F1F5F9] px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMoreDropdownOpen(false);
                          setRequestModalOpen(true);
                        }}
                        className="w-full h-7 px-2.5 rounded-md bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Request Custom Adapter...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* CONNECTOR CARDS GRID (Reactive to Search & Filter)                   */}
          {/* ===================================================================== */}
          {filteredConnectors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 xl:gap-4 w-full mb-3">
              {filteredConnectors.map((c, index) => {
                const isConnected =
                  c.id === 'erp'
                    ? erpConnected
                    : c.id === 'sql'
                    ? sqlConnected
                    : c.id === 'warehouse'
                    ? whConnected
                    : c.id === 'file'
                    ? fileConnected
                    : c.id === 'rest'
                    ? restConnected
                    : c.id === 'streaming'
                    ? streamingConnected
                    : storageConnected;

                const IconComponent = c.icon;

                const handleCardCta = () => {
                  if (c.id === 'erp') toggleErpConnection();
                  else if (c.id === 'sql') {
                    if (!sqlConnected) setSqlDialogOpen(true);
                    else handleSqlDisconnect();
                  } else if (c.id === 'warehouse') toggleWhConnection();
                  else if (c.id === 'file') toggleFileConnection();
                  else if (c.id === 'rest') toggleRestConnection();
                  else if (c.id === 'streaming') toggleStreamingConnection();
                  else if (c.id === 'storage') toggleStorageConnection();
                };

                return (
                  <motion.div
                    key={c.id}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 + index * 0.05 }}
                    className={`bg-white rounded-xl border p-4 sm:p-4.5 shadow-2xs hover:shadow-subtle transition-all flex flex-col justify-between min-h-[295px] ${
                      isConnected ? 'border-emerald-300 bg-emerald-50/10' : 'border-[#E2E8F0]'
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon + Status */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div
                          className={`w-10 h-10 rounded-lg border flex items-center justify-center shadow-2xs ${c.theme.iconBg} ${c.theme.iconBorder} ${c.theme.iconColor}`}
                        >
                          <IconComponent size={18} />
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                            isConnected
                              ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                              : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? 'bg-emerald-500' : 'bg-[#94A3B8]'
                            }`}
                          />
                          <span>{isConnected ? 'Connected' : 'Not connected'}</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-[16px] font-bold text-[#0B1727] tracking-tight mb-0.5">
                        {c.title}
                      </h3>
                      <p className="text-[11.5px] text-[#5B6B82] leading-snug mb-3">
                        {c.desc}
                      </p>

                      {/* Platforms / Formats */}
                      <div className="mb-2">
                        <span className="text-[9.5px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 block">
                          {c.sectionLabel}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {c.platforms.map((p) => {
                            const isMoreBadge = p === '+ More';
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  if (isMoreBadge) {
                                    setPlatformModalData({
                                      title: c.title,
                                      platforms: ALL_PLATFORMS_MAP[c.id] || c.platforms,
                                    });
                                  }
                                }}
                                className={`text-[10.5px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                                  isMoreBadge
                                    ? 'bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] hover:bg-[#BAE6FD] cursor-pointer font-bold'
                                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] cursor-default'
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Button / Action Area */}
                    {c.id === 'sql' && sqlConnected ? (
                      <div className="space-y-1 mt-2">
                        <div className="text-[10px] font-mono text-[#5B6B82] bg-[#F8FAFC] p-1 rounded-md border border-[#E2E8F0] truncate">
                          {sqlConnStr}
                        </div>
                        <button
                          type="button"
                          onClick={handleSqlDisconnect}
                          className="w-full h-8 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[11.5px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Unlink size={12} />
                          <span>Disconnect SQL</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCardCta}
                        className={`w-full h-9 rounded-lg border font-semibold text-[12.5px] flex items-center justify-between px-3 transition-all cursor-pointer group mt-2 ${
                          isConnected
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : `bg-white ${c.theme.btnBorder} ${c.theme.btnText} ${c.theme.btnHover}`
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isConnected ? (
                            <Unlink size={13} />
                          ) : c.id === 'file' ? (
                            <Upload size={13} />
                          ) : c.id === 'sql' ? (
                            <Database size={13} />
                          ) : c.id === 'warehouse' ? (
                            <Cloud size={13} />
                          ) : c.id === 'rest' ? (
                            <Globe size={13} />
                          ) : c.id === 'streaming' ? (
                            <Activity size={13} />
                          ) : c.id === 'storage' ? (
                            <HardDrive size={13} />
                          ) : (
                            <Link2 size={13} />
                          )}
                          <span>
                            {isConnected
                              ? c.id === 'file'
                                ? 'Clear File'
                                : `Disconnect ${c.title.split(' ')[0]}`
                              : c.ctaText}
                          </span>
                        </div>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="w-full bg-white rounded-xl border border-[#E2E8F0] p-8 my-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mb-2">
                <Search size={20} />
              </div>
              <h4 className="text-[15px] font-bold text-[#0B1727]">No data sources found</h4>
              <p className="text-xs text-[#5B6B82] mt-0.5 mb-3">
                No connectors match your filter &quot;{activeFilter}&quot; {searchQuery ? `or search &quot;${searchQuery}&quot;` : ''}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('All');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0284C7] font-semibold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 4. BOTTOM INFORMATION PANEL                                           */}
          {/* ===================================================================== */}
          <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-2.5 px-4 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 mb-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <Info size={15} />
              </div>
              <div className="text-[12px] leading-snug">
                <span className="font-bold text-[#0B1727] mr-1.5">
                  Don't see your system?
                </span>
                <span className="text-[#5B6B82]">
                  Any source reachable by a standard connector or API can be added here — this step prepares your data pipeline.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0B1727] font-semibold text-[11.5px] h-7 px-3 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Request a Connector</span>
              <ExternalLink size={12} className="text-[#64748B]" />
            </button>
          </div>

          {/* ===================================================================== */}
          {/* 5. BOTTOM NAVIGATION (Continue Action)                                */}
          {/* ===================================================================== */}
          <div className="flex items-center justify-end pt-0.5 mb-1">
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="h-9 px-6 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <span>Continue to Configuration</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 6. ENTERPRISE FOOTER                                                      */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E2E8F0] py-2 px-6 sm:px-10 lg:px-16 flex flex-col sm:flex-row justify-between items-center gap-1.5 text-[11.5px] text-[#64748B] z-20 relative bg-white/70 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2">
          <span>© 2026 AITEK. All rights reserved.</span>
          <span className="text-[#CBD5E1] font-light">|</span>
          <span>Enterprise Inventory Intelligence</span>
        </div>

        <div className="flex items-center gap-3.5 flex-wrap justify-center text-[11.5px]">
          <button
            type="button"
            onClick={() => toast.info('AITEK Enterprise Privacy Policy')}
            className="text-[#0284C7] hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Privacy Policy
          </button>
          <span className="text-[#CBD5E1] font-light">|</span>
          <button
            type="button"
            onClick={() => toast.info('AITEK Platform Terms of Service')}
            className="text-[#0284C7] hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Terms of Service
          </button>
          <span className="text-[#CBD5E1] font-light">|</span>
          <button
            type="button"
            onClick={() => toast.info('AITEK Technical Support: support@aitek.ai')}
            className="text-[#0284C7] hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Support
          </button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SQL CONNECT MODAL DIALOG                                                  */}
      {/* ========================================================================= */}
      <Dialog open={sqlDialogOpen} onOpenChange={setSqlDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0B1727]">
              <Database size={17} className="text-[#0284C7]" />
              <span>Connect SQL Database</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5B6B82]">
              Provide database credentials to ingest inventory snapshots and transactional movement logs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSqlConnectSubmit)} className="space-y-3 py-1 text-xs">
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">Database Engine</label>
              <Select value={engineValue} onValueChange={(val) => setValue('engine', val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                  <SelectItem value="MySQL">MySQL</SelectItem>
                  <SelectItem value="SQL Server">SQL Server</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Host</label>
                <Input
                  placeholder="db.company.internal"
                  {...register('host')}
                  className={`h-8 text-xs ${errors.host ? 'border-red-500' : ''}`}
                />
                {errors.host && <p className="text-[10px] text-red-500 mt-0.5">{errors.host.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Port</label>
                <Input
                  placeholder="5432"
                  {...register('port')}
                  className={`h-8 text-xs ${errors.port ? 'border-red-500' : ''}`}
                />
                {errors.port && <p className="text-[10px] text-red-500 mt-0.5">{errors.port.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">Database Name</label>
              <Input
                placeholder="inventory_prod"
                {...register('dbName')}
                className={`h-8 text-xs ${errors.dbName ? 'border-red-500' : ''}`}
              />
              {errors.dbName && <p className="text-[10px] text-red-500 mt-0.5">{errors.dbName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Username</label>
                <Input placeholder="svc_inventory_ro" {...register('username')} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Password</label>
                <Input type="password" placeholder="••••••••" {...register('password')} className="h-8 text-xs" />
              </div>
            </div>

            {/* Table Mappings Section */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
              <div className="text-[11px] font-bold text-[#0B1727]">Target Table Mappings</div>
              {[
                { label: 'Inventory Master', key: 'inventory', options: SQL_TABLE_OPTIONS.inventory },
                { label: 'Transactions / Movements', key: 'transactions', options: SQL_TABLE_OPTIONS.transactions },
                { label: 'Bill of Materials', key: 'bom', options: SQL_TABLE_OPTIONS.bom },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="text-[10px] font-semibold text-[#5B6B82] block mb-0.5">
                    {label}
                  </label>
                  <Select
                    value={tableMappings[key]}
                    onValueChange={(val) => setTableMappings((m) => ({ ...m, [key]: val }))}
                  >
                    <SelectTrigger className="h-6 text-[10.5px] font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt} value={opt} className="font-mono text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSqlDialogOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button type="submit" variant="accent" size="sm" className="gap-1.5 text-xs h-8 bg-[#0284C7] hover:bg-[#0369A1] text-white">
                <Link2 size={13} />
                <span>Test &amp; Connect</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SUPPORTED PLATFORMS MODAL (when + More clicked on card)                   */}
      {/* ========================================================================= */}
      <Dialog open={!!platformModalData} onOpenChange={(open) => !open && setPlatformModalData(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0B1727]">
              <Layers size={17} className="text-[#0284C7]" />
              <span>Supported {platformModalData?.title} Platforms</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5B6B82]">
              Native drivers and certified enterprise connectors available for this data source.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 py-2">
            {platformModalData?.platforms.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] font-medium text-[#0B1727]"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{p}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setPlatformModalData(null)}
              className="w-full text-xs h-8 bg-[#0284C7] hover:bg-[#0369A1] text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* REQUEST CONNECTOR MODAL                                                   */}
      {/* ========================================================================= */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0B1727]">
              <Sparkles size={17} className="text-[#0284C7]" />
              <span>Request Enterprise Connector</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5B6B82]">
              Tell us about your system or internal API. Our solutions engineering team builds certified integrations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestFormSubmit} className="space-y-3 py-1 text-xs">
            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                System / Provider Name *
              </label>
              <Input
                required
                placeholder="e.g., Workday SCM, Infor M3, Cassandra, Acumatica"
                value={requestFormData.systemName}
                onChange={(e) =>
                  setRequestFormData((prev) => ({ ...prev, systemName: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Connector Category
                </label>
                <Select
                  value={requestFormData.category}
                  onValueChange={(val) =>
                    setRequestFormData((prev) => ({ ...prev, category: val }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERP">ERP System</SelectItem>
                    <SelectItem value="Database">SQL / NoSQL DB</SelectItem>
                    <SelectItem value="Warehouse">Data Warehouse</SelectItem>
                    <SelectItem value="REST API">Custom REST / GraphQL</SelectItem>
                    <SelectItem value="Streaming">Streaming / Kafka</SelectItem>
                    <SelectItem value="Storage">Object Storage (S3 / Blob)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Contact Email
                </label>
                <Input
                  type="email"
                  value={requestFormData.email}
                  onChange={(e) =>
                    setRequestFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Additional Notes / Pipeline Requirements
              </label>
              <textarea
                rows={2}
                placeholder="Describe data frequency, auth method (OAuth2, mTLS, VPC peering), or custom schema..."
                value={requestFormData.notes}
                onChange={(e) =>
                  setRequestFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full rounded-md border border-[#CBD5E1] p-2 text-xs outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] bg-white resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRequestModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="sm"
                className="gap-1.5 text-xs h-8 bg-[#0284C7] hover:bg-[#0369A1] text-white"
              >
                <Send size={13} />
                <span>Submit Request</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
