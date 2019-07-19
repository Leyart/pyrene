import React from 'react';
import PropTypes from 'prop-types';
import ReactTable from 'react-table';
import checkboxHOC from 'react-table/lib/hoc/selectTable';
import classNames from 'classnames';

import './table.css';
import TablePagination from './TablePagination/TablePagination';
import Button from '../Button/Button';
import Loader from '../Loader/Loader';
import Filter from '../Filter/Filter';
import TableHeaderCell from './TableHeader/TableHeaderCell';
import TableHeader from './TableHeader/TableHeader';
import colorConstants from '../../styles/colorConstants';
import Checkbox from '../Checkbox/Checkbox';
import TableCell from './TableCell/TableCell';
import CheckboxPopover from '../CheckboxPopover/CheckboxPopover';
import TableUtils from './TableUtils';
import Banner from '../Banner/Banner';

const CheckboxTable = checkboxHOC(ReactTable);

const NoDataComponent = ({ error }) => (
  <div styleName="tableNoData">
    {
      error
        ? <Banner label={error} type="error" styling="inline" />
        : 'No data found.'
    }
  </div>
);

NoDataComponent.defaultProps = {
  error: null,
};

NoDataComponent.propTypes = {
  error: PropTypes.string,
};

const LoaderComponent = () => (
  <div styleName="loader">
    <Loader size="large" type="inline" />
  </div>
);

/**
 * Tables are used to display tabular data. Tables come with pagination and sorting functionality and also allows the user to toggle columns.
 *
 * Tables support multi sorting for columns.
 */
export default class Table extends React.Component {

  state = {
    selection: [],
    selectAll: false,
    columns: TableUtils.mapColumnProps(this.props.columns),
  };

  commonStaticProps = {
    getTrProps: (state, rowInfo) => {
      // no row selected yet
      const key = rowInfo && rowInfo.original[this.props.keyField];
      const selected = this.isSelected(key);
      // const selectedIndex = this.state.selection == null ? null : this.state.selection.index;
      return {
        onDoubleClick: () => { this.props.onRowDoubleClick(rowInfo); },
        style: {
          background: selected ? colorConstants.neutral030 : '',
        },
      };
    },

    getTdProps: (state, rowInfo, column) => ({
      onClick: (e, handleOriginal) => {
        if (column.id !== '_selector' && (typeof rowInfo !== 'undefined')) {
          this.singleRowSelection(rowInfo.original[this.props.keyField], rowInfo.original);
        }
        // IMPORTANT! React-Table uses onClick internally to trigger
        // events like expanding SubComponents and pivots.
        // By default a custom 'onClick' handler will override this functionality.
        // If you want to fire the original onClick handler, call the
        // 'handleOriginal' function.
        if (handleOriginal) {
          handleOriginal();
        }
      },
    }),

    onPageChange: () => {
      this.resetSelection();
    },
    onPageSizeChange: () => {
      this.resetSelection();
    },
    onSortedChange: () => {
      this.resetSelection();
    },
    onFilteredChange: () => {
      this.resetSelection();
    },

    // Removes React Table 'No rows found'
    NoDataComponent: props => null, // eslint-disable-line no-unused-vars
    // Removes React Table 'Loading...'
    LoadingComponent: props => null, // eslint-disable-line no-unused-vars

    minRows: 1,

    TheadComponent: props => <TableHeader {...props} multiSelect={this.props.multiSelect} />,
    ThComponent: props => <TableHeaderCell {...props} multiSelect={this.props.multiSelect} />,
    TdComponent: props => <TableCell {...props} multiSelect={this.props.multiSelect} />,
    PaginationComponent: props => <TablePagination {...props} />,
    TfootComponent: props => <TablePagination {...props} />,
    resizable: false,
    showPagination: true,
    showPaginationTop: true,
    showPageSizeOptions: true,
  };

  toggleColumnDisplay = (columnId, showValue) => {
    const updatedColumns = this.state.columns.map((col) => {
      if (col.id === columnId) {
        return { ...col, show: !showValue };
      }
      return col;
    });

    this.setState(() => ({
      columns: updatedColumns,
    }));
  };

  isColumnDisplayed = show => typeof show === 'undefined' || show === true;

  toggleAll = () => {
    // Only selects what is visible to the user (page size matters)
    const selectAll = !this.state.selectAll;
    const selection = [];

    if (selectAll) {
      // we need to get at the internals of ReactTable
      const resolvedState = this.checkboxTable.getWrappedInstance().getResolvedState();
      // the 'sortedData' property contains the currently accessible records based on the filter and sort

      const currentPageSize = resolvedState.pageSize;
      const currentPage = resolvedState.page;

      const currentRecords = resolvedState.sortedData.slice(currentPage * currentPageSize, currentPage * currentPageSize + currentPageSize);

      // we just push all the IDs onto the selection array
      currentRecords.forEach((item) => {
        const enabled = this.props.rowSelectableCallback(item._original); // eslint-disable-line no-underscore-dangle
        if (enabled) {
          selection.push(item._original[this.props.keyField]); // eslint-disable-line no-underscore-dangle
        }
      });
    }

    this.setState(() => ({
      selection: selection,
      selectAll: selectAll,
    }));
  };


  isSelected = key => this.state.selection.includes(key);

  resetSelection = () => {
    this.setState(() => ({
      selection: [],
      selectAll: false,
    }));
  };

  handleActionAvailability = (actionType) => {
    // enable actions based on selection length and actionType
    if (actionType === 'always') {
      return true;
    } if (this.state.selection.length === 1 && actionType === 'single') {
      return true;
    } if (this.state.selection.length >= 1 && actionType === 'multi') {
      return true;
    }
    return false;

  };

  singleRowSelection = (key, row) => {
    const enabled = this.props.rowSelectableCallback(row);
    if (enabled) {
      this.setState(() => ({
        selection: [key],
        selectAll: false,
      }));
    }
  };

  toggleSelection = (key, row) => {
    // start off with the existing state
    let selection = [...this.state.selection];
    const enabled = this.props.rowSelectableCallback(row);

    if (enabled) {
      if (this.props.multiSelect) {
        const keyIndex = selection.indexOf(key);
        // check to see if the key exists
        if (keyIndex >= 0) {
          selection = selection.filter(selectedKey => selectedKey !== key);
        } else {
          // it does not exist so add it
          selection.push(key);
        }
      } else {
        selection = [key];
      }
    }

    // if the current selection array has the same length as the pageSize then all the visible elements have to be selected
    const isWholePageSelected = selection.length === this.checkboxTable.getWrappedInstance().getResolvedState().pageSize;
    const areAllOptionsSelected = selection.length === this.props.data.length;

    this.setState(() => ({
      selection: selection,
      selectAll: isWholePageSelected || areAllOptionsSelected,
    }));
  };

  restoreColumnDefaults = () => {
    this.setState(() => ({
      columns: TableUtils.mapColumnProps(this.props.columns),
    }));
  };

  renderTable = (commonVariableProps) => {
    if (this.props.loading) {
      return (
        <ReactTable
          {...this.commonStaticProps}
          {...commonVariableProps}
          TbodyComponent={LoaderComponent}
        />
      );
    }
    // Empty Table handling
    if (!commonVariableProps.data.length || this.props.error) {
      return (
        <ReactTable
          {...this.commonStaticProps}
          {...commonVariableProps}
          TbodyComponent={() => (
            <NoDataComponent
              error={this.props.error}
            />
          )}
        />
      );
    }
    return this.props.multiSelect
      ? (
        <CheckboxTable
          {...this.commonStaticProps}
          {...commonVariableProps}
          ref={r => (this.checkboxTable = r)}
          selectType="checkbox"
          selectAll={this.state.selectAll}
          isSelected={this.isSelected}
          toggleSelection={this.toggleSelection}
          toggleAll={this.toggleAll}
          keyField={this.props.keyField}
          SelectAllInputComponent={props => <Checkbox value={props.checked} onChange={props.onClick} />}
          SelectInputComponent={(props) => {
            const enabled = this.props.rowSelectableCallback(props.row);
            return (
              <Checkbox
                disabled={!enabled}
                value={props.checked}
                onChange={() => {
                  const key = props.row[this.props.keyField];
                  this.toggleSelection(key, props.row);
                }}
              />
            );
          }}
        />
      )
      : (
        <ReactTable
          {...this.commonStaticProps}
          {...commonVariableProps}
        />
      );
  };

  render() {

    const commonVariableProps = {
      columns: this.state.columns,
      defaultSorted: this.props.defaultSorted,
      defaultPageSize: this.props.defaultPageSize,
      data: this.props.data,
      pageSizeOptions: this.props.pageSizeOptions,
      showPaginationBottom: !!(this.props.data && this.props.data.length && !this.props.error),

      multiSort: this.props.multiSort,
    };

    return (
      <div styleName="tableContainer">
        {this.props.title && (
          <div styleName="titleBar">
            {this.props.title}
          </div>
        )}

        <div styleName={classNames('filterBar', { loading: this.props.loading })}>
          <div styleName="filterContainer">
            {(this.props.filters.length > 0 || this.props.filterDisabled)
              && (
                <Filter
                  filters={this.props.filters}
                  onFilterSubmit={this.props.onFilterChange}
                  disabled={this.props.error ? true : this.props.loading}
                />
              )
            }
          </div>
          {this.props.toggleColumns && (
            <CheckboxPopover
              buttonLabel="Columns"
              listItems={this.state.columns.map(col => ({ id: col.id, label: col.Header, value: this.isColumnDisplayed(col.show) }))}
              onItemClick={(item, value) => this.toggleColumnDisplay(item, value)}
              onRestoreDefault={() => this.restoreColumnDefaults()}
            />
          )}
        </div>

        <div styleName={classNames('tableAndActions')}>

          {this.props.actions.length > 0 && (
            <div styleName="toolbar">
              {this.props.actions.map((action, index) => (
                <React.Fragment key={action.label}>
                  <Button label={action.label} icon={action.icon ? action.icon : undefined} onClick={() => action.callback(this.state.selection)} type="action" disabled={!this.handleActionAvailability(action.active)} />
                  {index + 1 < this.props.actions.length && <div styleName="spacer" />}
                </React.Fragment>
              ))}
            </div>
          )}
          {this.renderTable(commonVariableProps)}
        </div>
      </div>
    );
  }

}


Table.displayName = 'Table';

Table.defaultProps = {
  actions: [],
  title: '',
  defaultSorted: [],
  defaultPageSize: 10,
  loading: false,
  multiSort: true,
  multiSelect: false,
  rowSelectableCallback: () => true,
  toggleColumns: false,
  pageSizeOptions: [10, 20, 50, 100, 250],
  filterDisabled: false,
  filters: [],
  onRowDoubleClick: () => null,
  onFilterChange: () => null,
  error: null,
};

Table.propTypes = {
  /**
   * Sets the table actions. Type: [{ icon: string, label: string (required), callback: func (required), active: oneOf('single', 'multi', 'always') (required) }]
   */
  actions: PropTypes.arrayOf(PropTypes.shape({
    active: PropTypes.oneOf(['single', 'multi', 'always']).isRequired,
    callback: PropTypes.func.isRequired,
    icon: PropTypes.string,
    label: PropTypes.string.isRequired,
  })),
  /**
   * Sets the Table columns.
   * Type: [{ id: string (required), headerName: string (required), accessor: string (required), headerStyle: object, cellStyle: object, initiallyHidden: bool, width: number }]
   */
  columns: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  /**
   * Sets the Table data displayed in the rows. Type: JSON
   */
  data: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  /**
   * Sets the page size when the component is first mounted.
   */
  defaultPageSize: PropTypes.number,
  /**
   * Sets the default sorting columns and order when the component is first mounted.
   * Type: [{ id: string (required), desc: bool }]
   */
  defaultSorted: PropTypes.arrayOf(PropTypes.shape({
    desc: PropTypes.bool,
    id: PropTypes.string.isRequired,
  })),
  /**
   * Sets the error message to be displayed
   */
  error: PropTypes.string,
  /**
   * True if filter should be displayed but in disabled state (filters might be still undefined)
   * */
  filterDisabled: PropTypes.bool,
  /**
   * Sets the available filters.
   * Type: [{ label: string (required) label of the filter input displayed to the user, type: oneOf('singleSelect', 'multiSelect', 'text') (required),
   * filterKey: string (required) - key for the one filter input, options: array }]
   */
  filters: PropTypes.arrayOf(PropTypes.shape({
    filterKey: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      /** text displayed to the user in the filter dropdown */
      label: PropTypes.string.isRequired,
      /** key for manipulation */
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    })),
    type: PropTypes.oneOf(['singleSelect', 'multiSelect', 'text']).isRequired,
  })),
  /**
   * Sets the data key for each row. Should be unique. Is used for selections.
   */
  keyField: PropTypes.string.isRequired,
  /**
   * Disables the component and displays a loader inside of it.
   */
  loading: PropTypes.bool,
  /**
   * Changes the overall appearance of the table to become multi-selectable (checkbox table). Requires keyField prop.
   */
  multiSelect: PropTypes.bool,
  /**
    * Whether multiSorting via shift click is possible.
    */
  multiSort: PropTypes.bool,
  /**
   * Called when the filter changes.
   */
  onFilterChange: PropTypes.func,
  /**
    * Called when the user double clicks on a row.
    */
  onRowDoubleClick: PropTypes.func,
  /**
    * Sets the page sizes that the user can choose from.
    */
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  /**
    * Allow toggling wether a row (and checkbox for a checkboxtable) is selectable
    * @returns {boolean} - enabled = true, disabled = false
    */
  rowSelectableCallback: PropTypes.func,
  /**
   * Sets the title.
   */
  title: PropTypes.string,
  /**
   * Whether the columns (hide/show) popover is available to the user.
   */
  toggleColumns: PropTypes.bool,
};
