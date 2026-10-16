export type VerificationStatus =
  | 'VERIFIED_PRIMARY_PORTAL'
  | 'REQUIRES_OSS_CONFIRMATION'
  | 'REQUIRES_LOCAL_AUTHORITY_CONFIRMATION'
  | 'UNVERIFIED_OUT_OF_SCOPE';

export type CostCategory =
  | 'OFFICIAL_GOVERNMENT_FEE'
  | 'THIRD_PARTY_SERVICE_COST'
  | 'DOCUMENT_PREPARATION_EXPENSE'
  | 'OPTIONAL_COST'
  | 'LOCATION_OR_SCALE_DEPENDENT'
  | 'UNDETERMINED_COST';

export interface UserBusinessProfile {
  rawDescription: string;
  category: 'packaged_food' | 'catering' | 'salon' | 'ambiguous_drink' | 'unverified_custom';
  activityType: string;
  productDetail: string;
  productionLocation: 'dapur_rumah' | 'pabrik_terpisah' | 'dapur_khusus' | 'kios_sewa_kecil' | 'ruko_komersial' | 'belum_jelas';
  shelfLife?: 'lebih_7_hari' | 'kurang_7_hari' | 'serbuk_kering_awet' | 'langsung_habis' | 'cair_susu_dingin' | 'belum_jelas';
  riskIngredient?: 'rendah_kering' | 'susu_atau_beku' | 'belum_jelas';
  cosmeticUsage?: 'pakai_produk_bpom' | 'racik_sendiri';
  businessScale: 'mikro' | 'kecil';
  existingPermits: 'belum_ada' | 'sudah_nib';
}

export interface KbliCandidateRule {
  ruleId: string;
  code: string;
  officialActivityName: string;
  applicableCategories: UserBusinessProfile['category'][];
  matchExplanation: string;
  distinctionsAndConditions: string;
  verificationStatus: VerificationStatus;
  officialSourceTitle: string;
  officialSourceUrl: string;
  lastVerifiedNote: string;
}

export interface LicensingRequirementRule {
  ruleId: string;
  name: string;
  requirementGroup: 'UMUM_REGISTRASI' | 'BERSYARAT_AKTIVITAS' | 'BERSYARAT_PRODUK_LOKASI_SKALA' | 'KONFIRMASI_OTORITAS';
  applicableCategories: UserBusinessProfile['category'][];
  conditionPredicate: (profile: UserBusinessProfile) => boolean;
  purpose: string;
  whyAppliesTemplate: (profile: UserBusinessProfile) => string;
  exclusionsOrExceptions: string;
  prerequisites: string[];
  documentsToPrepare: string[];
  recommendedNextStep: string;
  responsibleInstitution: string;
  officialSourceUrl: string;
  verificationStatus: VerificationStatus;
  uncertaintyNotes: string;
}
