import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type CrossConnectTablePaginationProps = DataTablePaginationProps;

export const CrossConnectTablePagination: React.FC<
  CrossConnectTablePaginationProps
> = (props) => {
  return <DataTablePagination {...props} />;
};

export default CrossConnectTablePagination;
