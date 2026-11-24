import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type SiteTablePaginationProps = DataTablePaginationProps;

export const SiteTablePagination: React.FC<SiteTablePaginationProps> = (props) => {
  return <DataTablePagination {...props} />;
};

export default SiteTablePagination;
