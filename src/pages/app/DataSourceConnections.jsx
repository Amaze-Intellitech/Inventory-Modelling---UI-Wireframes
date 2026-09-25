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
import { Stepper, AlertBar } from '../../components/CommonUI';
import ThemeToggle from '../../components/ThemeToggle';
import { ONBOARDING_ROUTES } from '../../components/layout/OnboardingShell';
import { usePlatform } from '../../context/PlatformContext';
import { requiredConnectors } from '../../data/parameterCatalog';
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
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      btnBorder: 'border-primary',
      btnText: 'text-primary',
      btnHover: 'hover:bg-info-bg',
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
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      btnBorder: 'border-primary',
      btnText: 'text-primary',
      btnHover: 'hover:bg-info-bg',
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
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      btnBorder: 'border-primary',
      btnText: 'text-primary',
      btnHover: 'hover:bg-info-bg',
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
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      btnBorder: 'border-primary',
      btnText: 'text-primary',
      btnHover: 'hover:bg-info-bg',
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
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      btnBorder: 'border-primary',
      btnText: 'text-primary',
      btnHover: 'hover:bg-info-bg',
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
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      btnBorder: 'border-primary',
      btnText: 'text-primary',
      btnHover: 'hover:bg-info-bg',
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
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      btnBorder: 'border-primary',
      btnText: 'text-primary',
      btnHover: 'hover:bg-info-bg',
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
  // The parameters chosen on the previous step decide which sources are required.
  const { parameterSelection, connectedSources, setConnectedSources } = usePlatform();
  const wasConnected = (id) => connectedSources.includes(id);
  const [erpConnected, setErpConnected] = useState(() => wasConnected('erp'));
  const [whConnected, setWhConnected] = useState(() => wasConnected('warehouse'));
  const [fileConnected, setFileConnected] = useState(() => wasConnected('file'));
  const [restConnected, setRestConnected] = useState(() => wasConnected('rest'));
  const [streamingConnected, setStreamingConnected] = useState(() => wasConnected('streaming'));
  const [storageConnected, setStorageConnected] = useState(() => wasConnected('storage'));

  // SQL Connector State & Modal
  const [sqlDialogOpen, setSqlDialogOpen] = useState(false);
  const [sqlConnected, setSqlConnected] = useState(() => wasConnected('sql'));
  const [sqlConnStr, setSqlConnStr] = useState('');

  const connectedNow = [
    erpConnected && 'erp',
    sqlConnected && 'sql',
    whConnected && 'warehouse',
    fileConnected && 'file',
    restConnected && 'rest',
    streamingConnected && 'streaming',
    storageConnected && 'storage',
  ].filter(Boolean);

  useEffect(() => {
    setConnectedSources(connectedNow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedNow.join('|')]);

  const required = requiredConnectors(parameterSelection.rows);
  const requiredIds = required.map((r) => r.id);
  const missing = required.filter((r) => !connectedNow.includes(r.id));
  const parameterCount = required.reduce((n, r) => n + r.count, 0);
  const canContinue = missing.length === 0;
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

    // When default 'All' with no search, show the standard 4 primary cards for 16:9 desktop balance,
    // plus any source the chosen parameters need (or that is already connected) so it is never hidden behind "More".
    if (activeFilter === 'All') {
      return ['erp', 'sql', 'warehouse', 'file'].includes(c.id) || requiredIds.includes(c.id) || connectedNow.includes(c.id);
    }

    return c.categories.includes(activeFilter);
  });

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-bg select-none text-ink"
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
            background: 'radial-gradient(circle, rgba(91, 147, 255, 0.04) 0%, rgba(224, 242, 254, 0.02) 60%, transparent 80%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute -bottom-[15%] -right-[10%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(91, 147, 255, 0.05) 0%, rgba(240, 249, 255, 0.02) 60%, transparent 80%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. ENTERPRISE HEADER (Clean, well-spaced white bar)                       */}
      {/* ========================================================================= */}
      <header className="h-16 sm:h-[68px] bg-surface border-b border-border z-20 relative shrink-0">
        <div className="page-wrap h-full flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <img
            src={aitekLogo}
            alt="AITEK Logo"
            className="h-[44px] sm:h-[48px] w-auto object-contain"
          />
          <span className="text-[22px] sm:text-[25px] font-extrabold text-ink tracking-tight leading-none">
            AITEK
          </span>
          <span className="text-subtle mx-1 text-lg font-light">|</span>
          <span className="text-[14px] sm:text-[15px] font-semibold text-primary tracking-tight">
            Inventory Modelling
          </span>
        </div>

        {/* Right: User Profile & Help */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-info-bg border border-border text-primary font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              AV
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[12.5px] font-bold text-ink leading-tight group-hover:text-primary transition-colors">
                Alex Vance
              </span>
              <span className="text-xs text-subtle leading-tight">
                Enterprise Corp
              </span>
            </div>
            <ChevronDown size={13} className="text-subtle group-hover:text-ink transition-colors hidden sm:block" />
          </div>

          <div className="w-[1px] h-5 bg-border" />

          <button
            type="button"
            onClick={() => toast.info('AITEK Platform Help Center & Knowledge Base')}
            className="w-7 h-7 rounded-full border border-border text-subtle hover:text-ink hover:bg-bg flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Help & Documentation"
          >
            <HelpCircle size={15} />
          </button>
        </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. PROGRESS: Material → Parameters → Data sources → Ingestion             */}
      {/* ========================================================================= */}
      <div className="w-full bg-surface border-b border-border py-2.5 px-6 sm:px-10 lg:px-14 shrink-0 relative z-10">
        <div className="max-w-xl mx-auto">
          <Stepper steps={['Material', 'Parameters', 'Data sources', 'Ingestion']} current={3} className="mb-0" onStepClick={(n) => navigate(ONBOARDING_ROUTES[n - 1])} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT CONTAINER (Zero Scroll Budget)                            */}
      {/* ========================================================================= */}
      <main className="flex-1 page-wrap py-3 sm:py-3.5 relative z-10 flex flex-col justify-between overflow-hidden my-auto">
        <div>
          
          {/* Header Introduction */}
          <div className="mb-2.5">
            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">
              DATA SOURCES
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-ink tracking-tight leading-tight mb-1">
              Connect your data sources
            </h1>
            <p className="text-[13px] sm:text-[13.5px] text-subtle leading-snug max-w-3xl font-normal">
              Connect the sources your chosen parameters come from. Anything else is optional.
            </p>
          </div>

          {required.length === 0 ? (
            <AlertBar tone="info" title="No sources needed yet">
              You have not chosen any parameters with a source. Go back to choose them, or connect sources for later.
            </AlertBar>
          ) : (
            <AlertBar
              tone={canContinue ? 'success' : 'warning'}
              title={canContinue ? 'Every source your parameters need is connected' : `Needed for your ${parameterCount} selected parameters`}
            >
              {required.map((r) => `${r.label} (${r.count})`).join(' · ')}
              {canContinue ? '' : ` — still to connect: ${missing.map((m) => m.label).join(', ')}.`}
            </AlertBar>
          )}

          {/* Search + Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3">
            {/* Search Box */}
            <div className="relative w-full max-w-[500px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search data sources (e.g., SAP, Snowflake, SQL, Kafka, S3)"
                className="w-full h-[36px] pl-9 pr-3.5 rounded-lg border border-border-strong bg-surface text-[12.5px] text-ink placeholder:text-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-0.5 rounded cursor-pointer"
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
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary-solid text-white shadow-2xs'
                        : 'bg-surface border border-border text-ink hover:bg-bg'
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                    isMoreFilterActive || moreDropdownOpen
                      ? 'bg-primary-solid text-white border-primary shadow-2xs'
                      : 'bg-surface border-border text-ink hover:bg-bg'
                  }`}
                >
                  <span>{isMoreFilterActive ? activeFilter : 'More'}</span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform ${moreDropdownOpen ? 'rotate-180' : ''} ${
                      isMoreFilterActive || moreDropdownOpen ? 'text-white' : 'text-subtle'
                    }`}
                  />
                </button>

                {/* In-place Dropdown Popup */}
                {moreDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-surface rounded-xl shadow-[0_12px_36px_rgba(15,23,42,0.16)] border border-border py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-1 text-xs font-bold text-subtle uppercase tracking-wider flex items-center justify-between border-b border-border pb-1.5 mb-1">
                      <span>Additional Categories</span>
                      <span className="text-xs font-semibold text-primary bg-info-bg px-1.5 py-0.2 rounded">
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
                              isCatActive ? 'bg-info-bg text-primary' : 'hover:bg-bg text-ink'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                                  isCatActive
                                    ? 'bg-primary-solid text-white border-primary'
                                    : 'bg-muted-fill border-border text-subtle group-hover:text-primary group-hover:bg-info-bg'
                                }`}
                              >
                                <Icon size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[12px] font-bold leading-tight">
                                  {cat.label}
                                </span>
                                <span className="text-xs text-subtle leading-tight">
                                  {cat.desc}
                                </span>
                              </div>
                            </div>
                            {isCatActive && <Check size={13} className="text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Action inside Popover */}
                    <div className="mt-1 pt-1.5 border-t border-border px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMoreDropdownOpen(false);
                          setRequestModalOpen(true);
                        }}
                        className="w-full h-7 px-2.5 rounded-md bg-info-bg hover:bg-info-bg text-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                    className={`bg-surface rounded-xl border p-4 sm:p-4.5 shadow-2xs hover:shadow-subtle transition-all flex flex-col justify-between min-h-[295px] ${
                      isConnected ? 'border-success bg-[color-mix(in_srgb,var(--success-bg)_10%,transparent)]' : 'border-border'
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
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isConnected
                              ? 'bg-success-bg text-success-tx border-success'
                              : 'bg-muted-fill text-subtle border-border'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? 'bg-success' : 'bg-subtle'
                            }`}
                          />
                          <span>{isConnected ? 'Connected' : 'Not connected'}</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-[16px] font-bold text-ink tracking-tight mb-0.5 flex items-center gap-2 flex-wrap">
                        {c.title}
                        {requiredIds.includes(c.id) && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-info-bg text-info-tx">
                            Required · {required.find((r) => r.id === c.id).count}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-subtle leading-snug mb-3">
                        {c.desc}
                      </p>

                      {/* Platforms / Formats */}
                      <div className="mb-2">
                        <span className="text-xs font-bold text-subtle uppercase tracking-wider mb-1.5 block">
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
                                className={`text-xs font-medium px-2 py-0.5 rounded-md transition-colors ${
                                  isMoreBadge
                                    ? 'bg-info-bg border border-border text-primary hover:bg-info-bg cursor-pointer font-bold'
                                    : 'bg-bg border border-border text-ink cursor-default'
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
                        <div className="text-xs font-mono text-subtle bg-bg p-1 rounded-md border border-border truncate">
                          {sqlConnStr}
                        </div>
                        <button
                          type="button"
                          onClick={handleSqlDisconnect}
                          className="w-full h-8 rounded-lg border border-error bg-error-bg hover:bg-error-bg text-error-tx font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
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
                            ? 'border-success bg-success-bg text-success-tx hover:bg-success-bg'
                            : `bg-surface ${c.theme.btnBorder} ${c.theme.btnText} ${c.theme.btnHover}`
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
            <div className="w-full bg-surface rounded-xl border border-border p-8 my-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-muted-fill text-subtle flex items-center justify-center mb-2">
                <Search size={20} />
              </div>
              <h4 className="text-[15px] font-bold text-ink">No data sources found</h4>
              <p className="text-xs text-subtle mt-0.5 mb-3">
                No connectors match your filter &quot;{activeFilter}&quot; {searchQuery ? `or search &quot;${searchQuery}&quot;` : ''}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('All');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-strong bg-surface hover:bg-bg text-primary font-semibold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 4. BOTTOM INFORMATION PANEL                                           */}
          {/* ===================================================================== */}
          <div className="bg-info-bg border border-border rounded-xl p-2.5 px-4 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 mb-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-info-bg text-primary flex items-center justify-center shrink-0">
                <Info size={15} />
              </div>
              <div className="text-[12px] leading-snug">
                <span className="font-bold text-ink mr-1.5">
                  Don't see your system?
                </span>
                <span className="text-subtle">
                  Any source reachable by a standard connector or API can be added here — this step prepares your data pipeline.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="border border-border-strong bg-surface hover:bg-bg text-ink font-semibold text-xs h-7 px-3 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Request a Connector</span>
              <ExternalLink size={12} className="text-subtle" />
            </button>
          </div>

          {/* ===================================================================== */}
          {/* 5. BOTTOM NAVIGATION (Continue Action)                                */}
          {/* ===================================================================== */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 mb-1">
            <button
              type="button"
              onClick={() => navigate('/parameter-mapping')}
              className="text-[13px] font-semibold text-primary hover:text-ink underline underline-offset-4 cursor-pointer"
            >
              ← Change parameters
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <span id="continue-reason" className="text-[13px] text-subtle" data-testid="continue-reason">
                {canContinue
                  ? `${connectedNow.length} connected. Next we load your data.`
                  : `Connect ${missing.map((m) => m.label).join(' and ')} to load your ${parameterCount} selected parameters.`}
              </span>
              <button
                type="button"
                disabled={!canContinue}
                aria-describedby="continue-reason"
                onClick={() => navigate('/ingestion')}
                className="h-9 px-6 rounded-lg bg-primary-solid hover:bg-info-tx text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-solid disabled:hover:shadow-sm"
              >
                <span>Continue to ingestion</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 6. ENTERPRISE FOOTER                                                      */}
      {/* ========================================================================= */}
      <footer className="border-t border-border py-2 px-6 sm:px-10 lg:px-16 flex flex-col sm:flex-row justify-between items-center gap-1.5 text-xs text-subtle z-20 relative bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2">
          <span>© 2026 AITEK. All rights reserved.</span>
          <span className="text-subtle font-light">|</span>
          <span>Enterprise Inventory Intelligence</span>
        </div>

        <div className="flex items-center gap-3.5 flex-wrap justify-center text-xs">
          <button
            type="button"
            onClick={() => toast.info('AITEK Enterprise Privacy Policy')}
            className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Privacy Policy
          </button>
          <span className="text-subtle font-light">|</span>
          <button
            type="button"
            onClick={() => toast.info('AITEK Platform Terms of Service')}
            className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Terms of Service
          </button>
          <span className="text-subtle font-light">|</span>
          <button
            type="button"
            onClick={() => toast.info('AITEK Technical Support: support@aitek.ai')}
            className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
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
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
              <Database size={17} className="text-primary" />
              <span>Connect SQL Database</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-subtle">
              Provide database credentials to ingest inventory snapshots and transactional movement logs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSqlConnectSubmit)} className="space-y-3 py-1 text-xs">
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">Database Engine</label>
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
                <label className="text-xs font-semibold text-ink block mb-1">Host</label>
                <Input
                  placeholder="db.company.internal"
                  {...register('host')}
                  className={`h-8 text-xs ${errors.host ? 'border-error' : ''}`}
                />
                {errors.host && <p className="text-xs text-error-tx mt-0.5">{errors.host.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">Port</label>
                <Input
                  placeholder="5432"
                  {...register('port')}
                  className={`h-8 text-xs ${errors.port ? 'border-error' : ''}`}
                />
                {errors.port && <p className="text-xs text-error-tx mt-0.5">{errors.port.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1">Database Name</label>
              <Input
                placeholder="inventory_prod"
                {...register('dbName')}
                className={`h-8 text-xs ${errors.dbName ? 'border-error' : ''}`}
              />
              {errors.dbName && <p className="text-xs text-error-tx mt-0.5">{errors.dbName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">Username</label>
                <Input placeholder="svc_inventory_ro" {...register('username')} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">Password</label>
                <Input type="password" placeholder="••••••••" {...register('password')} className="h-8 text-xs" />
              </div>
            </div>

            {/* Table Mappings Section */}
            <div className="pt-2 border-t border-border space-y-1.5">
              <div className="text-xs font-bold text-ink">Target Table Mappings</div>
              {[
                { label: 'Inventory Master', key: 'inventory', options: SQL_TABLE_OPTIONS.inventory },
                { label: 'Transactions / Movements', key: 'transactions', options: SQL_TABLE_OPTIONS.transactions },
                { label: 'Bill of Materials', key: 'bom', options: SQL_TABLE_OPTIONS.bom },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-subtle block mb-0.5">
                    {label}
                  </label>
                  <Select
                    value={tableMappings[key]}
                    onValueChange={(val) => setTableMappings((m) => ({ ...m, [key]: val }))}
                  >
                    <SelectTrigger className="h-6 text-xs font-mono">
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
              <Button type="submit" variant="accent" size="sm" className="gap-1.5 text-xs h-8 bg-primary-solid hover:bg-info-tx text-white">
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
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
              <Layers size={17} className="text-primary" />
              <span>Supported {platformModalData?.title} Platforms</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-subtle">
              Native drivers and certified enterprise connectors available for this data source.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 py-2">
            {platformModalData?.platforms.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 p-2 rounded-lg bg-bg border border-border text-[12px] font-medium text-ink"
              >
                <div className="w-2 h-2 rounded-full bg-success shrink-0" />
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
              className="w-full text-xs h-8 bg-primary-solid hover:bg-info-tx text-white"
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
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
              <Sparkles size={17} className="text-primary" />
              <span>Request Enterprise Connector</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-subtle">
              Tell us about your system or internal API. Our solutions engineering team builds certified integrations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestFormSubmit} className="space-y-3 py-1 text-xs">
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
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
                <label className="text-xs font-semibold text-ink block mb-1">
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
                <label className="text-xs font-semibold text-ink block mb-1">
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
              <label className="text-xs font-semibold text-ink block mb-1">
                Additional Notes / Pipeline Requirements
              </label>
              <textarea
                rows={2}
                placeholder="Describe data frequency, auth method (OAuth2, mTLS, VPC peering), or custom schema..."
                value={requestFormData.notes}
                onChange={(e) =>
                  setRequestFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full rounded-md border border-border-strong p-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface resize-none"
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
                className="gap-1.5 text-xs h-8 bg-primary-solid hover:bg-info-tx text-white"
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
