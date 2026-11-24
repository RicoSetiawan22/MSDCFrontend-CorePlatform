import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type OtbTablePaginationProps = DataTablePaginationProps;

export const OtbTablePagination: React.FC<OtbTablePaginationProps> = (props) => {
  return <DataTablePagination {...props} />;
};

export default OtbTablePagination;
