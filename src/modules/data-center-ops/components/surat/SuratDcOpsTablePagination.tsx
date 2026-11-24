import React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "../common/DataTablePagination";

export type SuratDcOpsTablePaginationProps = DataTablePaginationProps;

export const SuratDcOpsTablePagination: React.FC<
  SuratDcOpsTablePaginationProps
> = (props) => {
  return <DataTablePagination {...props} />;
};

export default SuratDcOpsTablePagination;
