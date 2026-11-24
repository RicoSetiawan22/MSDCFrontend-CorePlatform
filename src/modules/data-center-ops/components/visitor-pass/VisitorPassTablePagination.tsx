import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type VisitorPassTablePaginationProps = DataTablePaginationProps;

export const VisitorPassTablePagination: React.FC<
  VisitorPassTablePaginationProps
> = (props) => {
  return <DataTablePagination {...props} />;
};

export default VisitorPassTablePagination;
