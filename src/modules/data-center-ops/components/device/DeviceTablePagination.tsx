import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type DeviceTablePaginationProps = DataTablePaginationProps;

export const DeviceTablePagination: React.FC<DeviceTablePaginationProps> = (
  props
) => {
  return <DataTablePagination {...props} />;
};

export default DeviceTablePagination;
