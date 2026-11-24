import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type DependentsTablePaginationProps = DataTablePaginationProps;

export const DependentsTablePagination: React.FC<
  DependentsTablePaginationProps
> = (props) => {
  return <DataTablePagination {...props} />;
};

export default DependentsTablePagination;
