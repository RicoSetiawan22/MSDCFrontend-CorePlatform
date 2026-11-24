import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type UsageTablePaginationProps = DataTablePaginationProps;

export const UsageTablePagination: React.FC<UsageTablePaginationProps> = (
  props
) => {
  return <DataTablePagination {...props} />;
};

export default UsageTablePagination;
