export interface OrgMembershipInfo {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: string;
}

export interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  is_superadmin: boolean;
  org_memberships: OrgMembershipInfo[];
}

export interface OrgOut {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  address: string | null;
  countries: string[];
  industries: string[];
}

export interface ThreatOut {
  id: string;
  organization_id: string;
  threat_id: string | null;
  category: string | null;
  name: string;
  description: string | null;
  aggregate_rating: number | null;
  aggregate_level: string | null;
  source: string | null;
  created_at: string;
}

export interface SoftwareOut {
  id: string;
  organization_id: string;
  software_id: string | null;
  name: string;
  status: string | null;
  business_unit: string | null;
  recovery_point_objective: string | null;
  recovery_time_objective: string | null;
  criticality: string | null;
  description: string | null;
  application_owner: string | null;
  data_classification: string | null;
  compliance: string | null;
  vendor_name: string | null;
  version: string | null;
  created_at: string;
}

export interface HardwareOut {
  id: string;
  organization_id: string;
  hardware_id: string | null;
  vendor: string | null;
  model: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
}

export interface MemberOut {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  is_superadmin: boolean;
  is_active: boolean;
}
