import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type RackTablePaginationProps = DataTablePaginationProps;

export const RackTablePagination: React.FC<RackTablePaginationProps> = (
  props
) => {
  return <DataTablePagination {...props} />;
};

export default RackTablePagination;
