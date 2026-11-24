import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type RoomTablePaginationProps = DataTablePaginationProps;

export const RoomTablePagination: React.FC<RoomTablePaginationProps> = (
  props
) => {
  return <DataTablePagination {...props} />;
};

export default RoomTablePagination;
