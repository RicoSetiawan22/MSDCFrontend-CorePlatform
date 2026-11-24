import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type IpamTablePaginationProps = DataTablePaginationProps;

export const IpamTablePagination: React.FC<IpamTablePaginationProps> = (
  props
) => {
  return <DataTablePagination {...props} />;
};

export default IpamTablePagination;
