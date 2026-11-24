import React from "react";
import type { IStaffDutySectionData } from "../../types/dashboard";
import { StaffOnDuty } from "./StaffOnDuty";

export { StaffOnDuty };

export interface StaffDutySectionProps {
  data?: IStaffDutySectionData | null;
  onViewAllStaff?: (siteId?: string | number) => void;
  onViewStaffProfile?: (staffId: string | number) => void;
}

export const StaffDutySection: React.FC<StaffDutySectionProps> = ({
  onViewStaffProfile,
}) => {
  return <StaffOnDuty onViewProfile={onViewStaffProfile} />;
};

export default StaffDutySection;
