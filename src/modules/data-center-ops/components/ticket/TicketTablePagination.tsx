import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type TicketTablePaginationProps = DataTablePaginationProps;

export const TicketTablePagination: React.FC<TicketTablePaginationProps> = (
  props
) => {
  return <DataTablePagination {...props} />;
};

export default TicketTablePagination;
