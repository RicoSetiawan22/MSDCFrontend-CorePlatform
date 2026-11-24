import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Currency, CurrencyFormValues, Bank, BankFormValues, Holiday, HolidayFormValues, NumberSequence, NumberSequenceFormValues, OvertimeRate, OvertimeRateFormValues, PostingRule, PostingRuleFormValues } from "../types/masterData";

const BASE = "/v1/core-platform";

export const masterDataApi = {
  // Currency/Bank/Holiday TIDAK dipaginasi - backend balas Model::get() datar
  // dibungkus {success,data:[...]} (sama pola non-paginated dengan
  // number-sequences/overtime-rates, lihat catatan di bawah).
  currencies() {
    return apiClient.get<{ success: boolean; data: Currency[] }>(`${BASE}/currencies`);
  },
  createCurrency(values: CurrencyFormValues) {
    return apiClient.post<ApiMessageResponse<Currency>>(`${BASE}/currencies`, values);
  },
  banks() {
    return apiClient.get<{ success: boolean; data: Bank[] }>(`${BASE}/banks`);
  },
  createBank(values: BankFormValues) {
    return apiClient.post<ApiMessageResponse<Bank>>(`${BASE}/banks`, values);
  },
  updateBank(id: number, values: Partial<BankFormValues>) {
    return apiClient.put<ApiMessageResponse<Bank>>(`${BASE}/banks/${id}`, values);
  },
  deleteBank(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/banks/${id}`);
  },
  holidays(params: { year?: number }) {
    return apiClient.get<{ success: boolean; data: Holiday[] }>(`${BASE}/holidays`, { params });
  },
  createHoliday(values: HolidayFormValues) {
    return apiClient.post<ApiMessageResponse<Holiday>>(`${BASE}/holidays`, values);
  },
  updateHoliday(id: number, values: Partial<HolidayFormValues>) {
    return apiClient.put<ApiMessageResponse<Holiday>>(`${BASE}/holidays/${id}`, values);
  },
  deleteHoliday(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/holidays/${id}`);
  },
  // NumberSequenceController::index() balas NumberSequence::all() APA
  // ADANYA - array datar, TIDAK dipaginasi (beda dari resource lain di
  // sini) - jangan pakai PaginatedResponse<T>, itu bikin field .total dkk
  // selalu undefined.
  numberSequences() {
    return apiClient.get<{ success: boolean; data: NumberSequence[] }>(`${BASE}/number-sequences`);
  },
  createNumberSequence(values: NumberSequenceFormValues) {
    return apiClient.post<ApiMessageResponse<NumberSequence>>(`${BASE}/number-sequences`, values);
  },
  updateNumberSequence(id: number, values: Partial<NumberSequenceFormValues> & { force?: boolean }) {
    return apiClient.put<ApiMessageResponse<NumberSequence>>(`${BASE}/number-sequences/${id}`, values);
  },
  // Overtime Rate - sama pola non-paginated dengan number-sequences (lihat
  // catatan di atas), OvertimeRateController::index() balas array datar.
  overtimeRates() {
    return apiClient.get<{ success: boolean; data: OvertimeRate[] }>(`${BASE}/overtime-rates`);
  },
  createOvertimeRate(values: OvertimeRateFormValues) {
    return apiClient.post<ApiMessageResponse<OvertimeRate>>(`${BASE}/overtime-rates`, values);
  },
  updateOvertimeRate(id: number, values: OvertimeRateFormValues) {
    return apiClient.put<ApiMessageResponse<OvertimeRate>>(`${BASE}/overtime-rates/${id}`, values);
  },
  postingRules(transactionType?: string) {
    return apiClient.get<{ success: boolean; data: PostingRule[] }>(`${BASE}/posting-rules`, { params: { transaction_type: transactionType } });
  },
  updatePostingRule(id: number, values: PostingRuleFormValues) {
    return apiClient.put<ApiMessageResponse<PostingRule>>(`${BASE}/posting-rules/${id}`, values);
  },
  // Geography
  countries() {
    return apiClient.get<PaginatedResponse<{ id: number; name: string; code: string }>>(`${BASE}/countries`);
  },
  provinces(countryId: number) {
    return apiClient.get<PaginatedResponse<{ id: number; name: string; country_id: number }>>(`${BASE}/countries/${countryId}/provinces`);
  },
};
