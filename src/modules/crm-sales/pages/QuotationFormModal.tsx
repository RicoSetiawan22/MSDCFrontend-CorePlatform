import { useState, useEffect, useRef, Fragment, type FormEvent } from "react";
import { ArrowLeft, Plus, Trash2, Briefcase, X, FileText, CalendarDays, ListChecks, StickyNote, Save } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCreateQuotation, useUpdateQuotation } from "../api/useQuotations";
import { opportunityApi } from "../api/opportunityApi";
import { quotationApi } from "../api/quotationApi";
import { useProductList } from "../api/useProducts";
import { useActivePromoPackages } from "../api/useProducts";
import { useOpportunity } from "../api/useOpportunities";
import { useContract } from "../api/useContracts";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { InputField } from "@shared/components/InputField";
import { NumberSequenceSetupModal } from "@modules/core-platform/components/NumberSequenceSetupModal";
import { extractErrorMessage, extractNumberSequenceError, type NumberSequenceNotConfiguredError } from "@shared/types/api";
import { formatCurrency } from "@shared/lib/format";
import type { Quotation, QuotationLine, QuotationLineFormValues } from "../types/quotation";
import type { Product, PromoPackage } from "../types/product";
import type { Opportunity } from "../types/opportunity";

type SourceType = "product" | "promo_package";

const UI = {
  navy: "#092747",
  navyText: "#16213D",
  orange: "#F7AB00",
  orangeDark: "#D99200",
  slate: "#64748B",
  slateLight: "#94A3B8",
  border: "#E5E7EB",
  light: "#F8FAFC",
  page: "#F5F7FA",
  white: "#FFFFFF",
  green: "#16A34A",
  red: "#DC2626",
};


const QUOTATION_FORM_STYLES = `
.crm-quotation-form { min-height:100%; padding-bottom:30px; background:#f5f7fb; color:#1e293b; }
.crm-quotation-form * { box-sizing:border-box; }
.crm-quotation-form .quotation-form-content {
  width:100%; max-width:1280px; margin:0 auto;
  padding:12px clamp(16px,2.2vw,32px) 36px !important;
}
.crm-quotation-form .quotation-form-intro {
  padding:20px 24px !important; margin-bottom:16px !important;
  border:1px solid #e2e8f0 !important; border-radius:18px !important;
  background:#fff !important; box-shadow:0 4px 20px -8px rgba(15,39,71,.09);
}
.crm-quotation-form .quotation-form-panel {
  border:1px solid #e2e8f0 !important; border-radius:16px !important;
  background:#fff !important; box-shadow:0 3px 14px rgba(15,39,71,.045);
}
.crm-quotation-form .quotation-form-panel__header {
  padding:14px 18px !important; border-bottom:1px solid #edf1f5 !important;
  background:#f8fafc !important; color:#102b4e !important;
}
.crm-quotation-form .quotation-form-panel__body { padding:18px !important; }
.crm-quotation-form input, .crm-quotation-form select, .crm-quotation-form textarea {
  border-color:#dbe3ed !important; border-radius:10px !important; color:#1e293b !important;
  font:inherit; transition:border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.crm-quotation-form input:focus, .crm-quotation-form select:focus, .crm-quotation-form textarea:focus {
  border-color:#f0a800 !important; outline:none !important;
  box-shadow:0 0 0 4px rgba(240,168,0,.12) !important;
}
.crm-quotation-form .quotation-form-grid {
  grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:16px !important; padding:18px !important;
}
.crm-quotation-form .quotation-form-table-wrap { width:100%; overflow-x:auto; }
.crm-quotation-form .quotation-form-table { width:100%; min-width:820px; border-collapse:separate !important; border-spacing:0; }
.crm-quotation-form .quotation-form-table thead th {
  padding:12px 10px !important; background:#f8fafc !important; color:#64748b !important;
  border-bottom:1px solid #e2e8f0 !important; font-size:.66rem !important; font-weight:800 !important;
}
.crm-quotation-form .quotation-form-table tbody td { padding:10px !important; border-bottom:1px solid #edf1f5; vertical-align:top; }
.crm-quotation-form .quotation-form-table tbody tr:hover { background:#fbfcfe; }
.crm-quotation-form .quotation-opportunity-selected {
  border:1px solid #e2e8f0 !important; border-left:4px solid #f0a800 !important;
  border-radius:13px !important; background:#f8fafc !important;
  box-shadow:0 3px 10px rgba(15,39,71,.04);
}
.crm-quotation-form .quotation-opportunity-options {
  border:1px solid #e2e8f0 !important; border-radius:13px !important;
  box-shadow:0 14px 32px rgba(15,39,71,.14) !important;
}
.crm-quotation-form .quotation-opportunity-option { transition:background .16s ease; }
.crm-quotation-form .quotation-opportunity-option:hover { background:#f8fafc !important; }
.crm-quotation-form .quotation-form-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:8px; }
.crm-quotation-form .quotation-form-actions button { min-height:42px; border-radius:11px !important; transition:transform .18s ease, box-shadow .18s ease; }
.crm-quotation-form .quotation-form-actions button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 12px rgba(15,39,71,.09); }
.crm-quotation-form button:focus-visible { outline:3px solid rgba(240,168,0,.28); outline-offset:2px; }
@media (max-width:760px) {
  .crm-quotation-form .quotation-form-content { padding-left:16px !important; padding-right:16px !important; }
  .crm-quotation-form .quotation-form-intro { padding:16px !important; }
  .crm-quotation-form .quotation-form-grid { grid-template-columns:1fr !important; }
  .crm-quotation-form .quotation-form-actions { flex-direction:column-reverse; }
  .crm-quotation-form .quotation-form-actions button { width:100%; }
}

/* Soft MSDC form – shared visual language with Prospek Baru and Customer Baru. */
.crm-quotation-form .quotation-form-content { max-width:1600px !important; padding:12px clamp(16px,2.2vw,32px) 40px !important; }
.crm-quotation-form .quotation-form-nav {
  display:flex; justify-content:space-between; align-items:center; gap:.8rem;
  flex-wrap:wrap; margin-bottom:1.1rem;
}
.crm-quotation-form .quotation-form-back {
  display:inline-flex; justify-content:center; align-items:center; gap:.65rem;
  min-height:43px; padding:.65rem 1rem;
  border:1px solid #f6cf71; border-radius:12px;
  color:#966000; background:linear-gradient(180deg,#fffaf1 0%,#fff1d0 100%);
  font-size:.76rem; font-weight:800; cursor:pointer;
  box-shadow:0 4px 12px rgba(190,129,0,.06);
}
.crm-quotation-form .quotation-form-back:hover { border-color:#e6b63c; background:#ffedbe; }
.crm-quotation-form .quotation-form-mode {
  display:inline-flex; align-items:center; min-height:31px; padding:.35rem .75rem;
  border:1px solid #e3eaf4; border-radius:999px; color:#71859e; background:white;
  font-size:.68rem; font-weight:800;
}
.crm-quotation-form .quotation-form-intro {
  display:flex !important; align-items:center !important; justify-content:space-between;
  gap:1rem; padding:1.35rem 1.5rem !important;
  background:linear-gradient(110deg,#f4f9ff 0%,#fff 54%,#fff9e9 100%) !important;
  border:1px solid #e1e9f3 !important; border-radius:19px !important;
  box-shadow:0 5px 16px rgba(15,39,71,.04);
}
.crm-quotation-form .quotation-form-intro__main { display:flex; align-items:center; gap:1rem; }
.crm-quotation-form .quotation-form-intro__icon {
  display:inline-flex; align-items:center; justify-content:center;
  width:62px; height:62px; flex:0 0 62px;
  border-radius:18px; border:1px solid #f8dc9d; background:#fff0c6; color:#b77a00;
}
.crm-quotation-form .quotation-form-intro__title { font-size:1.14rem; font-weight:850; color:#0b2c4c; letter-spacing:-.02em; }
.crm-quotation-form .quotation-form-intro__subtitle { margin-top:.36rem; font-size:.76rem; line-height:1.55; color:#71849c; }
.crm-quotation-form .quotation-form-panel {
  border:1px solid #e5edf5 !important; border-radius:18px !important;
  background:#fff !important; box-shadow:0 5px 17px rgba(15,39,71,.045) !important;
}
.crm-quotation-form .quotation-form-panel__header {
  display:flex !important; align-items:center; justify-content:space-between;
  gap:1rem; padding:16px 18px !important;
  background:linear-gradient(110deg,#f6faff 0%,#fff 64%,#fffaf0 100%) !important;
  border-bottom:1px solid #eaf0f7 !important;
  font-size:.82rem; font-weight:850;
}
.crm-quotation-form .quotation-form-section-heading { display:flex; align-items:center; gap:.72rem; min-width:0; }
.crm-quotation-form .quotation-form-section-icon {
  display:inline-flex; justify-content:center; align-items:center; flex:0 0 40px;
  width:40px; height:40px; border:1px solid #e0eafa; border-radius:12px;
  background:#eef5ff; color:#2563eb;
}
.crm-quotation-form .quotation-form-panel--opportunity .quotation-form-section-icon { border-color:#fbe4ae; color:#b97900; background:#fff6e4; }
.crm-quotation-form .quotation-form-panel--items .quotation-form-section-icon { border-color:#fbe4ae; color:#b97900; background:#fff6e4; }
.crm-quotation-form .quotation-form-panel__header > .quotation-form-section-heading > div > div:first-child { color:#0c2a4b; font-size:.83rem; font-weight:850; }
.crm-quotation-form .quotation-form-grid { gap:1.1rem !important; padding:20px !important; }
.crm-quotation-form input, .crm-quotation-form select, .crm-quotation-form textarea { border-radius:11px !important; background:#fff !important; }
.crm-quotation-form .quotation-form-table-wrap { border-radius:0 0 16px 16px; }
.crm-quotation-form .quotation-form-table thead th { background:#f4f8fc !important; }
.crm-quotation-form .quotation-form-actions {
  padding:1rem .15rem 0; gap:.75rem; align-items:center;
}
.crm-quotation-form .quotation-form-actions button { min-height:44px; padding:.63rem 1.15rem; font-weight:800; }
@media (max-width:600px) {
  .crm-quotation-form .quotation-form-intro { padding:1.05rem !important; }
  .crm-quotation-form .quotation-form-intro__icon { width:46px; height:46px; flex-basis:46px; }
  .crm-quotation-form .quotation-form-mode { display:none; }
  .crm-quotation-form .quotation-form-section-icon { width:36px;height:36px;flex-basis:36px; }
}

@media (prefers-reduced-motion: reduce) { .crm-quotation-form * { transition:none !important; animation:none !important; } }


/* Shared MSDC back navigation button: matched to Detail Produk & Jasa. */
.crm-msdc-back-button.crm-msdc-back-button {
  display: inline-flex !important;
  min-height: 43px !important;
  align-items: center !important;
  justify-content: center !important;
  align-self: flex-start !important;
  gap: 9px !important;
  padding: 0 17px !important;
  border: 1px solid #f7d27b !important;
  border-radius: 12px !important;
  background: linear-gradient(180deg, #fff9ed 0%, #fff2d2 100%) !important;
  color: #996100 !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  line-height: 1.25 !important;
  text-decoration: none !important;
  box-shadow: 0 3px 10px rgba(215, 153, 17, .07) !important;
  cursor: pointer !important;
  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease !important;
  white-space: normal !important;
  text-align: center !important;
}
.crm-msdc-back-button.crm-msdc-back-button:hover:not(:disabled) {
  border-color: #e9b948 !important;
  background: #ffeab0 !important;
  color: #805000 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 7px 18px rgba(215, 153, 17, .14) !important;
}
.crm-msdc-back-button.crm-msdc-back-button:focus-visible {
  outline: 3px solid rgba(247, 171, 0, .3) !important;
  outline-offset: 2px !important;
}
.crm-msdc-back-button.crm-msdc-back-button svg {
  flex: 0 0 auto;
}
@media (max-width: 640px) {
  .crm-msdc-back-button.crm-msdc-back-button {
    min-height: 42px !important;
    gap: 8px !important;
    padding: 0 14px !important;
  }
}
`;

const sectionStyle = {
  background: UI.white,
  border: `1px solid ${UI.border}`,
  borderRadius: 10,
  overflow: "hidden",
} as const;

const sectionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  padding: "0.8rem 1rem",
  borderBottom: `1px solid ${UI.border}`,
  background: UI.white,
  color: UI.navyText,
  fontSize: "0.82rem",
  fontWeight: 800,
} as const;

const compactInputStyle = {
  width: "100%",
  minHeight: 34,
  padding: "0.35rem 0.5rem",
  border: `1px solid ${UI.border}`,
  borderRadius: 8,
  background: UI.white,
  color: UI.navyText,
  fontSize: "0.8rem",
} as const;


const DEFAULT_LINE: QuotationLineFormValues = {
  source_type: "product",
  product_id: null,
  promo_package_id: null,
  description: "",
  quantity: 1,
  unit_price: 0,
  discount_pct: 0,
  billing_type: "recurring",
};

// HARUS cocok persis dengan OpportunityStage backend (lihat catatan di
// types/opportunity.ts) - dulu ada "discovery"/"solution_design"/
// "management_approval" yang TIDAK PERNAH ada di database.
const STAGE_LABELS: Record<string, string> = {
  qualification: "Kualifikasi",
  needs_analysis: "Analisis Kebutuhan",
  proposal: "Proposal",
  negotiation: "Negosiasi",
  closed_won: "Menang",
  closed_lost: "Kalah",
};

const STAGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  qualification: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  needs_analysis: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  proposal: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  negotiation: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  closed_won: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  closed_lost: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
};

interface QuotationFormRouteState {
  prefillOpportunityId?: number;
  editQuotation?: Quotation & { lines?: QuotationLine[] };
}

interface Props {
  prefillOpportunityId?: number;
  editQuotation?: Quotation & { lines?: QuotationLine[] };
  onSaved?: () => void;
  onCancel?: () => void;
}

export function QuotationFormPage({
  prefillOpportunityId: prefillOpportunityIdProp,
  editQuotation: editQuotationProp,
  onSaved,
  onCancel,
}: Props = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeState = (location.state ?? null) as QuotationFormRouteState | null;

  const queryOpportunityId = Number(searchParams.get("opportunity_id"));
  const prefillOpportunityId =
    prefillOpportunityIdProp ??
    routeState?.prefillOpportunityId ??
    (Number.isFinite(queryOpportunityId) && queryOpportunityId > 0 ? queryOpportunityId : undefined);
  const editQuotation = editQuotationProp ?? routeState?.editQuotation;
  const isEdit = !!editQuotation;
  
const quotationMode = searchParams.get("mode");

const isAdditionalService =
  !isEdit && quotationMode === "additional-service";

const isRenewal =
  !isEdit && quotationMode === "renewal";

const isContractBasedQuotation =
  isRenewal || isAdditionalService;

const contractIdParam = Number(
  searchParams.get("contract_id")
);

const renewalContractId =
  Number.isSafeInteger(contractIdParam) &&
  contractIdParam > 0
    ? contractIdParam
    : undefined;
const {
  data: renewalContract,
  isLoading: renewalLoading,
  isError: renewalError,
} = useContract(
  (isRenewal || isAdditionalService)
    ? renewalContractId
    : undefined
);

  const { data: editDetail, isLoading: editLoading, isError: editIsError, refetch: refetchEdit } = useQuery({
    queryKey: ["quotations", "edit-detail", editQuotation?.id ?? 0],
    queryFn: () => quotationApi.show(editQuotation!.id).then(response => response.data.data),
    enabled: isEdit && !!editQuotation?.id,
    staleTime: 0,
  });
  const hydratedEditId = useRef<number | null>(null);

  function closePage() {
    if (onCancel) {
      onCancel();
      return;
    }
    navigate("/crm-sales/quotations");
  }

  function finishPage() {
    if (onSaved) {
      onSaved();
      return;
    }
    navigate("/crm-sales/quotations");
  }

  // Opportunity
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [oppSearch, setOppSearch] = useState("");
  const [oppDropdownOpen, setOppDropdownOpen] = useState(false);

  // Line items — pre-fill from edit quotation
  const [quotationDate, setQuotationDate] = useState(
    editQuotation?.quotation_date ?? new Date().toISOString().slice(0, 10)
  );
  const [validUntil, setValidUntil] = useState(() => {
    if (editQuotation?.valid_until) return editQuotation.valid_until;
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState(editQuotation?.notes ?? "");
  const [lines, setLines] = useState<QuotationLineFormValues[]>(
    editQuotation?.lines?.map((l: QuotationLine) => ({
      source_type: l.promo_package_id ? "promo_package" as const : "product" as const,
      product_id: l.product_id,
      promo_package_id: l.promo_package_id,
      description: l.description,
      quantity: l.quantity,
      unit_price: Number(l.unit_price),
      discount_pct: Number(l.discount_pct),
      billing_type: l.billing_type ?? "recurring",
      cc_source_location: l.cc_source_location ?? "",
      cc_destination_location: l.cc_destination_location ?? "",
    })) ?? [{ ...DEFAULT_LINE }]
  );
  const [error, setError] = useState<string | null>(null);

  // Endpoint daftar tidak membawa lines. Jangan pernah menampilkan form edit kosong
  // lalu mengirim baris default; isi dari endpoint detail sebelum edit diizinkan.
  useEffect(() => {
    if (!editDetail || !isEdit || hydratedEditId.current === editDetail.id) return;
    hydratedEditId.current = editDetail.id;
    setQuotationDate(editDetail.quotation_date?.slice(0, 10) ?? "");
    setValidUntil(editDetail.valid_until?.slice(0, 10) ?? "");
    setNotes(editDetail.notes ?? "");
    setLines((editDetail.lines ?? []).map(line => ({
      source_type: line.promo_package_id ? "promo_package" : "product",
      product_id: line.product_id ?? null,
      promo_package_id: line.promo_package_id ?? null,
      description: line.description ?? "",
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
      discount_pct: Number(line.discount_pct ?? 0),
      tax_pct: Number(line.tax_pct ?? 0),
      billing_type: line.billing_type ?? "recurring",
      cc_source_location: line.cc_source_location ?? "",
      cc_destination_location: line.cc_destination_location ?? "",
    })));
  }, [editDetail, isEdit]);

  // Ambil seluruh Opportunity sekali (berhalaman), kemudian cari secara lokal.
  // Dengan begitu pencarian nama customer/lead tetap bekerja walau endpoint
  // Opportunity backend hanya mendukung atau mengabaikan parameter `search`.
  const { data: allOpportunities = [], isLoading: oppLoading, isError: oppIsError } = useQuery({
    queryKey: ["opportunities", "list", "quotation-picker-all"],
    queryFn: async (): Promise<Opportunity[]> => {
      const results: Opportunity[] = [];
      let page = 1;

      while (true) {
        const response = await opportunityApi.list({ page, per_page: 100 });
        const pagination = response.data;
        const items = pagination.data ?? [];
        results.push(...items);

        if (page >= pagination.last_page || items.length === 0) break;
        page += 1;
      }

      return results;
    },
    staleTime: 30_000,
  });
  // Ambil SEMUA quotation dari setiap halaman, tanpa filter status.
  // Sekalipun statusnya masih Draft, Opportunity tersebut tidak boleh dipilih
  // untuk pembuatan quotation BARU. Mengambil satu halaman saja tidak cukup.
  const { data: allQuotations = [], isLoading: quotLoading, isError: quotIsError } = useQuery({
    queryKey: ["quotations", "list", "quotation-picker-all"],
    queryFn: async (): Promise<Quotation[]> => {
      const results: Quotation[] = [];
      let page = 1;
      while (true) {
        const response = await quotationApi.list({ page, per_page: 100 });
        const pagination = response.data;
        const items = pagination.data ?? [];
        results.push(...items);
        if (page >= pagination.last_page || items.length === 0) break;
        page += 1;
      }
      return results;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: prefillOpp } = useOpportunity(
  isContractBasedQuotation
    ? undefined
    : prefillOpportunityId
);

  // Gunakan ID, bukan nama customer/Opportunity: satu customer bisa punya
  // beberapa Opportunity yang berbeda. Semua status quotation dihitung.
  const quotedOpportunityIds = new Set(
    allQuotations
      .filter((qt) => qt.opportunity_id != null)
      .map((qt) => Number(qt.opportunity_id)),
  );

  // HANYA Opportunity yang BELUM PERNAH memiliki quotation boleh muncul.
  // Search dilakukan setelah penyaringan agar berlaku untuk nama Opportunity,
  // customer, lead, dan nomor Opportunity sekaligus.
  const searchTerms = oppSearch.trim().toLocaleLowerCase("id-ID").split(/\s+/).filter(Boolean);
  const opportunities = allOpportunities.filter((opp) => {
    if (quotedOpportunityIds.has(Number(opp.id))) return false;
    if (searchTerms.length === 0) return true;
    const searchable = [
      opp.name,
      opp.opportunity_number,
      opp.customer?.company_name,
      opp.customer?.customer_code,
      opp.lead?.company_name,
      opp.lead?.lead_number,
    ].filter(Boolean).join(" ").toLocaleLowerCase("id-ID");
    return searchTerms.every((term) => searchable.includes(term));
  });
  const { data: products = [] } = useProductList({ is_active: true });
  const { data: promoPackages = [] } = useActivePromoPackages();
  const create = useCreateQuotation();
  const update = useUpdateQuotation();

  // Prefill lewat URL juga wajib mengikuti aturan hanya Opportunity tanpa
  // quotation, agar filter dropdown tidak bisa dilewati lewat tautan lama.
  useEffect(() => {
    if (
  isContractBasedQuotation ||
  !prefillOpp ||
  quotLoading ||
  quotIsError
) return;

    if (quotedOpportunityIds.has(Number(prefillOpp.id))) {
      setSelectedOpp(null);
      setError("Opportunity ini sudah pernah dibuatkan quotation. Silakan pilih Opportunity lain.");
    } else {
      setSelectedOpp(prefillOpp);
    }
  }, [isRenewal, prefillOpp, allQuotations, quotLoading, quotIsError]);

  function selectOpportunity(opp: Opportunity) {
    if (quotedOpportunityIds.has(Number(opp.id))) return;
    setSelectedOpp(opp);
    setOppDropdownOpen(false);
    setOppSearch("");
    setError(null);
  }
  function clearOpportunity() {
    setSelectedOpp(null);
    setOppSearch("");
    setOppDropdownOpen(false);
  }
  function addLine() { setLines(prev => [...prev, { ...DEFAULT_LINE }]); }
  function removeLine(i: number) { setLines(prev => prev.filter((_, idx) => idx !== i)); }
  function setSourceType(i: number, type: SourceType) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, source_type: type, product_id: null, promo_package_id: null, description: "", unit_price: 0 } : l));
  }
  function selectProduct(i: number, product: Product) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, product_id: product.id, promo_package_id: null, description: product.name, unit_price: product.base_price } : l));
  }
  function selectPromoPackage(i: number, pkg: PromoPackage) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, product_id: null, promo_package_id: pkg.id, description: pkg.name, unit_price: (pkg.promo_price ?? pkg.normal_price) as number } : l));
  }
  function updateLine(i: number, field: keyof QuotationLineFormValues, value: string | number) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }
  function lineTotal(line: QuotationLineFormValues) {
    const gross = (line.quantity ?? 0) * (line.unit_price ?? 0);
    return gross - gross * ((line.discount_pct ?? 0) / 100);
  }
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  const [seqError, setSeqError] = useState<NumberSequenceNotConfiguredError | null>(null);

  async function submitOnce() {
    
if (isEdit && editQuotation) {
  await update.mutateAsync({
    id: editQuotation.id,
    values: {
      quotation_date: quotationDate,
      valid_until: validUntil,
      notes: notes || undefined,
      lines,
    },
  });
    } else {
      if (isRenewal && !renewalContract?.customer_id) {
  throw new Error(
    "Customer pada kontrak perpanjangan belum tersedia."
  );
}
      const payload: Record<string, unknown> = {
        ...(isRenewal
  ? { customer_id: renewalContract?.customer_id }
  : { opportunity_id: selectedOpp!.id }),
        quotation_date: quotationDate,
        valid_until: validUntil,
        
notes: [
  isRenewal && renewalContract
    ? `Perpanjangan kontrak: ${renewalContract.contract_number}`
    : "",
  notes.trim(),
].filter(Boolean).join("\n") || undefined,

        lines,
      };
      
if (!isRenewal && selectedOpp?.customer_id) {
  payload["customer_id"] = selectedOpp.customer_id;
}

if (!isRenewal && selectedOpp?.lead_id) {
  payload["lead_id"] = selectedOpp.lead_id;
}
      await create.mutateAsync(payload as unknown as Parameters<typeof create.mutateAsync>[0]);
    }
    finishPage();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
if (isRenewal) {
  if (
    !renewalContractId ||
    renewalLoading ||
    renewalError ||
    !renewalContract
  ) {
    setError(
      "Data kontrak perpanjangan belum berhasil dimuat."
    );
    return;
  }

  if (!renewalContract.customer_id) {
    setError(
      "Customer pada kontrak perpanjangan tidak tersedia."
    );
    return;
  }
}
    
if (
  !isEdit &&
  !isRenewal &&
  (oppLoading || quotLoading || oppIsError || quotIsError)
) {
  setError(
    "Daftar Opportunity dan quotation belum berhasil dimuat. Silakan coba lagi."
  );
  return;
}

    if (!isEdit && !isRenewal && !selectedOpp) {
  setError("Pilih Opportunity terlebih dahulu.");
  return;
}

    if (isEdit && (!editDetail || hydratedEditId.current !== editDetail.id)) { setError("Data Quotation belum selesai dimuat."); return; }
    if (isEdit && lines.length === 0) { setError("Item Quotation lama tidak tersedia. Penyimpanan dibatalkan agar data tidak terhapus."); return; }
    const firstInvalid = lines.findIndex(l => !l.description.trim());
    if (firstInvalid >= 0) { setError(`Baris ${firstInvalid + 1} belum punya deskripsi.`); return; }
    setError(null);
    try {
      await submitOnce();
    } catch (err) {
      const seq = extractNumberSequenceError(err);
      if (seq) { setSeqError(seq); return; }
      setError(extractErrorMessage(err));
    }
  }

  if (isEdit && (editLoading || (!editDetail && !editIsError))) return (
    <div style={{ padding: 32, color: UI.navyText }}><PageHeader title="Edit Quotation" subtitle="Memuat data penawaran lama..." />
      <p style={{ padding: 20 }}>Sedang mengambil isi Quotation, termasuk seluruh item.</p></div>
  );
  if (isEdit && (editIsError || (editDetail && !editDetail.lines?.length))) return (
    <div style={{ padding: 32, color: UI.navyText }}><PageHeader title="Edit Quotation" subtitle="Data lama belum dapat diambil" />
      <div role="alert" style={{ padding: 20, background: "#fef2f2", color: "#b91c1c", borderRadius: 8 }}>
        Item Quotation lama gagal dimuat. Tidak ada perubahan yang disimpan.
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button type="button" onClick={() => void refetchEdit()}>Coba lagi</Button>
          <Button type="button" variant="secondary" onClick={closePage}>Kembali</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="crm-quotation-form" style={{ minHeight: "100%", background: UI.page, color: UI.navyText }}>
      <style>{QUOTATION_FORM_STYLES}</style>
      <PageHeader
        title="Quotations"
        subtitle="Buat dan kelola penawaran layanan untuk customer atau lead."
        containerClassName="px-7 pt-5 pb-2"
      />
      <div className="quotation-form-content" style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0.5rem 2rem 3rem" }}>

       
        <div className="quotation-form-nav">
          <button type="button" className="quotation-form-back crm-msdc-back-button" onClick={closePage}>
            <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Daftar Quotation
          </button>
          <span className="quotation-form-mode">{isEdit ? "Edit Penawaran" : "Form Quotation Baru"}</span>
        </div>

        <section className="quotation-form-intro">
          <div className="quotation-form-intro__main">
            <span className="quotation-form-intro__icon" aria-hidden="true"><FileText size={27} /></span>
            <div>
              <div className="quotation-form-intro__title">
                {isEdit ? "Edit Quotation" : isRenewal ? "Buat Quotation Perpanjangan" : "Buat Quotation Baru"}
              </div>
              <div className="quotation-form-intro__subtitle">
                {isEdit
                  ? "Perbarui informasi quotation dan item penawaran."
                  : isRenewal
                    ? "Buat penawaran perpanjangan berdasarkan kontrak pelanggan tanpa Opportunity baru."
                    : "Lengkapi opportunity, periode quotation, serta item layanan yang ditawarkan."}
              </div>
            </div>
          </div>
        </section>

        <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          color: UI.navyText,
        }}
      >
        
{/* Informasi kontrak untuk quotation perpanjangan */}
{isRenewal && (
  <section
    className="quotation-form-panel"
    style={sectionStyle}
  >
    <div
      className="quotation-form-panel__header"
      style={sectionHeaderStyle}
    >
      <span className="quotation-form-section-heading"><span className="quotation-form-section-icon" aria-hidden="true"><FileText size={19} /></span>Informasi Kontrak Asal</span>
    </div>

    <div
      className="quotation-form-panel__body"
      style={{
        padding: "1rem",
        color: UI.navyText,
        fontSize: "0.8rem",
      }}
    >
      {renewalLoading ? (
        <p>Memuat data kontrak...</p>
      ) : renewalError || !renewalContract ? (
        <p role="alert" style={{ color: UI.red }}>
          Data kontrak gagal dimuat.
        </p>
      ) : (
        <>
          <p>
            <strong>Nomor Kontrak:</strong>{" "}
            {renewalContract.contract_number}
          </p>

          <p style={{ marginTop: 8 }}>
            <strong>Customer:</strong>{" "}
            {renewalContract.customer?.company_name ??
              `Customer #${renewalContract.customer_id}`}
          </p>

          <p style={{ marginTop: 8, color: UI.slate }}>
            Quotation perpanjangan dibuat tanpa
            Opportunity baru.
          </p>
        </>
      )}
    </div>
  </section>
)}

        {/* Opportunity */}
        {!isEdit && !isRenewal && (
          <section className="quotation-form-panel quotation-form-panel--opportunity" style={{ ...sectionStyle, overflow: "visible", position: "relative", zIndex: oppDropdownOpen ? 20 : "auto" }}>
            <div className="quotation-form-panel__header" style={sectionHeaderStyle}>
              <div className="quotation-form-section-heading">
                <span className="quotation-form-section-icon" aria-hidden="true"><Briefcase size={19} /></span>
                <div>
                  <div>Pilih Opportunity</div>
                  <div style={{ marginTop: 3, color: UI.slate, fontSize: "0.7rem", fontWeight: 500 }}>
                    Hubungkan quotation dengan peluang yang sedang diproses.
                  </div>
                </div>
              </div>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: "#FFF7E6",
                  color: UI.orangeDark,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                }}
              >
                WAJIB
              </span>
            </div>
            <div style={{ padding: "1rem" }}>
              {!selectedOpp ? (
                <OpportunityPicker
                  opportunities={opportunities}
                  search={oppSearch}
                  onSearch={setOppSearch}
                  isOpen={oppDropdownOpen}
                  onOpen={() => setOppDropdownOpen(true)}
                  onClose={() => setOppDropdownOpen(false)}
                  isLoading={oppLoading || quotLoading}
                  isError={oppIsError || quotIsError}
                  onSelect={selectOpportunity}
                />
              ) : (
                <OpportunitySelectedCard opportunity={selectedOpp} onClear={clearOpportunity} />
              )}
            </div>
          </section>
        )}

        {/* Informasi quotation */}
        <section className="quotation-form-panel" style={sectionStyle}>
          <div className="quotation-form-panel__header" style={sectionHeaderStyle}>
            <span className="quotation-form-section-heading"><span className="quotation-form-section-icon" aria-hidden="true"><CalendarDays size={19} /></span>Informasi Quotation</span>
          </div>
          <div
            className="quotation-form-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0 1rem",
              padding: "1rem",
            }}
          >
            <InputField label="Tanggal Quotation" type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} />
            <InputField label="Valid Until" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>
        </section>

        {/* Line items */}
        <section className="quotation-form-panel quotation-form-panel--items" style={sectionStyle}>
          <div className="quotation-form-panel__header" style={sectionHeaderStyle}>
            <div className="quotation-form-section-heading">
              <span className="quotation-form-section-icon" aria-hidden="true"><ListChecks size={19} /></span>
              <div>
                <div>Item Penawaran</div>
                <div style={{ marginTop: 3, color: UI.slate, fontSize: "0.7rem", fontWeight: 500 }}>
                  Pilih produk atau paket promo, lalu atur billing, jumlah, harga, dan diskon.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={addLine}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0.45rem 0.75rem",
                border: `1px solid ${UI.border}`,
                borderRadius: 8,
                background: UI.white,
                color: UI.navyText,
                cursor: "pointer",
                fontSize: "0.76rem",
                fontWeight: 800,
              }}
            >
              <Plus size={14} /> Tambah Baris
            </button>
          </div>

          <div className="quotation-form-table-wrap" style={{ overflowX: "auto" }}>
            <table
              className="quotation-form-table"
              style={{
                width: "100%",
                minWidth: 820,
                borderCollapse: "collapse",
                fontSize: "0.8rem",
              }}
            >
              <thead>
                <tr style={{ background: UI.light }}>
                  {[
                    ["Sumber", "11%", "left"],
                    ["Item", "26%", "left"],
                    ["Billing", "10%", "left"],
                    ["Qty", "7%", "right"],
                    ["Unit Price", "13%", "right"],
                    ["Disc%", "7%", "right"],
                    ["Total", "14%", "right"],
                    ["", "7%", "center"],
                  ].map(([label, width, align]) => (
                    <th
                      key={`${label}-${width}`}
                      style={{
                        width,
                        padding: "0.65rem 0.55rem",
                        borderBottom: `1px solid ${UI.border}`,
                        color: UI.slate,
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        letterSpacing: "0.03em",
                        textAlign: align as "left" | "right" | "center",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const selectedProduct = products.find(p => p.id === line.product_id);
                  const isCrossConnect = selectedProduct?.service_type === "cross_connect";
                  return (
                    <Fragment key={i}>
                      <tr style={{ borderBottom: `1px solid ${UI.border}` }}>
                        <td style={{ padding: "0.5rem 0.55rem", verticalAlign: "top" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            {(["product", "promo_package"] as SourceType[]).map(type => {
                              const active = line.source_type === type;
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setSourceType(i, type)}
                                  style={{
                                    border: `1px solid ${active ? UI.navy : UI.border}`,
                                    background: active ? UI.navy : UI.white,
                                    borderRadius: 7,
                                    padding: "0.28rem 0.45rem",
                                    color: active ? UI.white : UI.slate,
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {type === "product" ? "Produk" : "Paket Promo"}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td style={{ padding: "0.5rem 0.55rem", verticalAlign: "top" }}>
                          {line.source_type === "product" ? (
                            <select
                              className="input"
                              value={line.product_id ?? ""}
                              onChange={e => {
                                const p = products.find(x => x.id === Number(e.target.value));
                                if (p) selectProduct(i, p);
                              }}
                              style={compactInputStyle}
                            >
                              <option value="">— Pilih Produk —</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatCurrency(Number(p.base_price))})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              className="input"
                              value={line.promo_package_id ?? ""}
                              onChange={e => {
                                const p = promoPackages.find(x => x.id === Number(e.target.value));
                                if (p) selectPromoPackage(i, p);
                              }}
                              style={compactInputStyle}
                            >
                              <option value="">— Pilih Paket Promo —</option>
                              {promoPackages.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatCurrency(Number(p.promo_price))})
                                  {Number(p.discount_pct) > 0 ? ` -${Number(p.discount_pct).toFixed(0)}%` : ""}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        <td style={{ padding: "0.5rem 0.55rem", verticalAlign: "top" }}>
                          <select
                            className="input"
                            value={line.billing_type ?? "recurring"}
                            onChange={e => updateLine(i, "billing_type", e.target.value)}
                            style={{ ...compactInputStyle, fontSize: "0.74rem" }}
                            title="One-Time = ditagih sekali (mis. instalasi). Recurring = ikut tagihan bulanan otomatis."
                          >
                            <option value="recurring">Recurring</option>
                            <option value="one_time">One-Time</option>
                          </select>
                        </td>

                        <td style={{ padding: "0.5rem 0.35rem", verticalAlign: "top" }}>
                          <input
                            className="input"
                            type="number"
                            min={1}
                            value={line.quantity}
                            onFocus={e => e.currentTarget.select()}
                            onChange={e => updateLine(i, "quantity", Number(e.target.value))}
                            style={{ ...compactInputStyle, textAlign: "right" }}
                          />
                        </td>

                        <td style={{ padding: "0.5rem 0.35rem", verticalAlign: "top" }}>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            value={line.unit_price}
                            onFocus={e => e.currentTarget.select()}
                            onChange={e => updateLine(i, "unit_price", Number(e.target.value))}
                            style={{ ...compactInputStyle, textAlign: "right" }}
                          />
                        </td>

                        <td style={{ padding: "0.5rem 0.35rem", verticalAlign: "top" }}>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            max={100}
                            value={line.discount_pct}
                            onFocus={e => e.currentTarget.select()}
                            onChange={e => updateLine(i, "discount_pct", Number(e.target.value))}
                            style={{ ...compactInputStyle, textAlign: "right" }}
                          />
                        </td>

                        <td
                          style={{
                            padding: "0.65rem 0.55rem",
                            color: UI.navyText,
                            fontFamily: "monospace",
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            textAlign: "right",
                            verticalAlign: "top",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatCurrency(lineTotal(line))}
                        </td>

                        <td style={{ padding: "0.5rem 0.35rem", textAlign: "center", verticalAlign: "top" }}>
                          {lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(i)}
                              title="Hapus baris"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 30,
                                height: 30,
                                border: `1px solid #FECACA`,
                                borderRadius: 7,
                                background: "#FFF",
                                color: UI.red,
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>

                      {isCrossConnect && (
                        <tr>
                          <td colSpan={8} style={{ padding: "0.75rem 1rem", background: UI.light, borderBottom: `1px solid ${UI.border}` }}>
                            <div style={{ marginBottom: "0.55rem", color: UI.navyText, fontSize: "0.72rem", fontWeight: 800 }}>
                              Detail Cross Connect
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                              <div>
                                <label className="input-label" style={{ fontSize: "0.7rem" }}>Titik A (Sumber) *</label>
                                <input
                                  className="input"
                                  value={line.cc_source_location ?? ""}
                                  onChange={e => updateLine(i, "cc_source_location", e.target.value)}
                                  placeholder="mis. Rack R01-U10, Patch Panel A Port 5"
                                  style={compactInputStyle}
                                />
                              </div>
                              <div>
                                <label className="input-label" style={{ fontSize: "0.7rem" }}>Titik B (Tujuan) *</label>
                                <input
                                  className="input"
                                  value={line.cc_destination_location ?? ""}
                                  onChange={e => updateLine(i, "cc_destination_location", e.target.value)}
                                  placeholder="mis. Meet-Me-Room A — Carrier XYZ Port 12"
                                  style={compactInputStyle}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.9rem",
              padding: "0.8rem 1rem",
              background: UI.light,
              borderTop: `1px solid ${UI.border}`,
            }}
          >
            <span style={{ color: UI.slate, fontSize: "0.76rem", fontWeight: 700 }}>Subtotal</span>
            <span
              style={{
                color: UI.navyText,
                fontFamily: "monospace",
                fontSize: "1rem",
                fontWeight: 900,
              }}
            >
              {formatCurrency(subtotal)}
            </span>
          </div>
        </section>

        <section className="quotation-form-panel" style={sectionStyle}>
          <div className="quotation-form-panel__header" style={sectionHeaderStyle}>
            <span className="quotation-form-section-heading"><span className="quotation-form-section-icon" aria-hidden="true"><StickyNote size={19} /></span>Catatan</span>
          </div>
          <div style={{ padding: "1rem" }}>
            <InputField label="Catatan" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..." />
          </div>
        </section>

        {error && (
          <div
            style={{
              padding: "0.75rem 0.9rem",
              border: "1px solid #FECACA",
              borderRadius: 8,
              background: "#FEF2F2",
              color: "#B91C1C",
              fontSize: "0.78rem",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <div
          className="quotation-form-actions"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.6rem",
            paddingTop: "0.25rem",
          }}
        >
          <Button
            type="button"
            variant="secondary"
            onClick={closePage}
            style={{
              minWidth: 96,
              border: `1px solid ${UI.border}`,
              background: UI.white,
              color: UI.navyText,
            }}
          >
            Batal
          </Button>
          <Button
            type="submit"
            
disabled={
  create.isPending ||
  update.isPending ||
  (
    !isEdit &&
    (
      isRenewal
        ? renewalLoading ||
          renewalError ||
          !renewalContract?.customer_id
        : !selectedOpp
    )
  )
}
            style={{
              minWidth: 160,
              background: UI.orange,
              borderColor: UI.orange,
              color: UI.white,
              fontWeight: 800,
            }}
          >
            <Save size={16} aria-hidden="true" />
            {create.isPending || update.isPending
              ? "Menyimpan..."
              : isEdit
                ? "Simpan Perubahan"
                : "Buat Quotation"}
          </Button>
        </div>
      </form>

        {seqError && (
          <NumberSequenceSetupModal
            moduleCode={seqError.module_code}
            suggestedPrefix={seqError.suggested_prefix}
            suggestedFormat={seqError.suggested_format}
            lockModuleCode
            onClose={() => setSeqError(null)}
            onCreated={() => { setSeqError(null); submitOnce().catch((err) => setError(extractErrorMessage(err))); }}
          />
        )}
      </div>
    </div>
  );
}

// ── Opportunity Picker ─────────────────────────────────────────────────────
function OpportunityPicker({ opportunities, search, onSearch, isOpen, onOpen, onClose, isLoading, isError, onSelect }: {
  opportunities: Opportunity[];
  search: string;
  onSearch: (v: string) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isLoading: boolean;
  isError: boolean;
  onSelect: (opp: Opportunity) => void;
}) {
  const stageCfg = (stage: string) => STAGE_COLORS[stage] ?? { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  const owner = (opp: Opportunity) => opp.customer?.company_name ?? opp.lead?.company_name ?? "—";

  return (
    <div
      className="quotation-opportunity-picker"
      style={{ position: "relative" }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          padding: "0.15rem 0.75rem",
          border: `1px solid ${UI.border}`,
          borderRadius: 9,
          background: UI.light,
        }}
      >
        <Briefcase size={16} color={UI.orangeDark} />
        <input
          className="input"
          style={{
            flex: 1,
            minHeight: 38,
            border: 0,
            outline: "none",
            background: "transparent",
            color: UI.navyText,
            boxShadow: "none",
          }}
          placeholder="Cari opportunity — ketik nama atau kode..."
          value={search}
          onFocus={onOpen}
          onClick={onOpen}
          onChange={e => { onSearch(e.target.value); onOpen(); }}
          aria-label="Cari dan pilih Opportunity"
          aria-expanded={isOpen}
        />
      </div>

      {isOpen && (
        <div
          className="quotation-opportunity-options"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 20,
            maxHeight: 300,
            marginTop: "0.4rem",
            overflowY: "auto",
            border: `1px solid ${UI.border}`,
            borderRadius: 10,
            background: UI.white,
            boxShadow: "0 12px 30px rgba(9,39,71,0.14)",
          }}
        >
          {isLoading && (
            <div style={{ padding: "1rem", color: UI.slate, fontSize: "0.78rem", textAlign: "center" }}>
              Memuat daftar Opportunity...
            </div>
          )}
          {!isLoading && isError && (
            <div style={{ padding: "1rem", color: UI.red, fontSize: "0.78rem", textAlign: "center" }}>
              Gagal memuat Opportunity. Silakan coba lagi.
            </div>
          )}
          {!isLoading && !isError && opportunities.length === 0 && (
            <div style={{ padding: "1rem", color: UI.slate, fontSize: "0.78rem", textAlign: "center" }}>
              {search ? "Tidak ada Opportunity tanpa quotation yang cocok." : "Semua Opportunity sudah memiliki quotation atau belum ada Opportunity tersedia."}
            </div>
          )}

          {!isLoading && !isError && opportunities.map(opp => {
            const cfg = stageCfg(opp.stage);
            return (
              <button
                className="quotation-opportunity-option"
                key={opp.id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => onSelect(opp)}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 0.85rem",
                  border: 0,
                  borderBottom: `1px solid ${UI.border}`,
                  background: UI.white,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      overflow: "hidden",
                      color: UI.navyText,
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {opp.name}
                  </div>
                  <div style={{ marginTop: 2, color: UI.slate, fontFamily: "monospace", fontSize: "0.67rem" }}>
                    {opp.opportunity_number} · {owner(opp)}
                    {opp.estimated_value ? ` · ${formatCurrency(Number(opp.estimated_value))}` : ""}
                  </div>
                </div>

                <span
                  style={{
                    flexShrink: 0,
                    padding: "3px 8px",
                    border: `1px solid ${cfg.border}`,
                    borderRadius: 999,
                    background: cfg.bg,
                    color: cfg.color,
                    fontSize: "0.62rem",
                    fontWeight: 800,
                  }}
                >
                  {STAGE_LABELS[opp.stage] ?? opp.stage}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opportunity Selected Card ───────────────────────────────────────────────
function OpportunitySelectedCard({ opportunity, onClear }: { opportunity: Opportunity; onClear: () => void }) {
  const cfg = STAGE_COLORS[opportunity.stage] ?? { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  const ownerName = opportunity.customer?.company_name ?? opportunity.lead?.company_name ?? "—";
  const isLead = !!opportunity.lead_id;

  return (
    <div
      className="quotation-opportunity-selected"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        padding: "0.85rem 1rem",
        border: `1px solid ${UI.border}`,
        borderLeft: `4px solid ${UI.orange}`,
        borderRadius: 9,
        background: UI.light,
      }}
    >
      <div
        style={{
          display: "flex",
          width: 38,
          height: 38,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9,
          background: UI.navy,
        }}
      >
        <Briefcase size={18} color={UI.white} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: UI.orangeDark, fontFamily: "monospace", fontSize: "0.66rem", fontWeight: 800 }}>
          {opportunity.opportunity_number}
        </div>
        <div
          style={{
            overflow: "hidden",
            marginTop: 1,
            color: UI.navyText,
            fontSize: "0.9rem",
            fontWeight: 800,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {opportunity.name}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              background: isLead ? "#FFF7E6" : "#ECFDF3",
              color: isLead ? UI.orangeDark : UI.green,
              fontSize: "0.68rem",
              fontWeight: 800,
            }}
          >
            {isLead ? "Lead" : "Customer"}
          </span>
          <span style={{ color: UI.slate, fontSize: "0.76rem", fontWeight: 600 }}>{ownerName}</span>
          {opportunity.estimated_value && (
            <span style={{ color: UI.navyText, fontFamily: "monospace", fontSize: "0.76rem", fontWeight: 800 }}>
              {formatCurrency(Number(opportunity.estimated_value))}
            </span>
          )}
          <span
            style={{
              padding: "2px 8px",
              border: `1px solid ${cfg.border}`,
              borderRadius: 999,
              background: cfg.bg,
              color: cfg.color,
              fontSize: "0.61rem",
              fontWeight: 800,
            }}
          >
            {STAGE_LABELS[opportunity.stage] ?? opportunity.stage}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        title="Ganti opportunity"
        style={{
          display: "flex",
          width: 30,
          height: 30,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${UI.border}`,
          borderRadius: 7,
          background: UI.white,
          color: UI.slate,
          cursor: "pointer",
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
