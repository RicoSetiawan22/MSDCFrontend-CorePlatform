import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type WorkOrderTablePaginationProps = DataTablePaginationProps;

export const WorkOrderTablePagination: React.FC<
  WorkOrderTablePaginationProps
> = (props) => {
  return <DataTablePagination {...props} />;
};

export default WorkOrderTablePagination;
