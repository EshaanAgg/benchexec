import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";
import Table from './ReactTable.js';
import Summary from './Summary.js';
import SelectColumn from './SelectColumn.js';
import ScatterPlot from './ScatterPlot.js';
import QuantilePlot from './QuantilePlot.js';
import LinkOverlay from './LinkOverlay.js';

if (process.env.NODE_ENV !== 'production') {
    window.data = require('../data/data.json');
}

console.log('table data', window.data);

export default class Overview extends React.Component {
    constructor(props) {
        super(props);
        this.tableHeader = window.data.head;
        this.tools = window.data.tools.map(t => ({
            ...t, 
            isVisible: true, 
            columns: t.columns.map(c => ({ ...c, isVisible: true }))
        }));
        this.columns = window.data.tools.map(t => t.columns.map(c => c.title));
        this.data = window.data.rows;
        this.stats = window.data.stats;
        this.filtered = [];

        this.state = {
            showSelectColumns: false,
            showLinkOverlay: false,
            columns: this.columns,
            tools: this.tools,
            table: this.data,
            filtered: [],
            tabIndex: 0,
            quantilePreSelection: this.tools[0].columns[0],
        }
    };

// -----------------------SelectColumns-----------------------
    toggleSelectColumns = () => {
        this.setState(prevState => ({ 
            showSelectColumns: !prevState.showSelectColumns,
        }));
    }

// -----------------------Filter-----------------------
    setFilter = (filteredData) => {
        this.filteredData = filteredData.map(row => {
            return row._original;
        });
    }
    filterPlotData = (filter) => {
       this.setState({
           table: this.filteredData,
           filtered: filter
       })
    }
    resetFilters = () => {
        this.setState({
            table: this.data,
            filtered: []
        })
    }

    // -----------------------Link Overlay-----------------------
    toggleLinkOverlay = (ev, hrefRow) => {
        this.setState(prevState => ({ 
            showLinkOverlay: !prevState.showLinkOverlay,
            link: hrefRow,
        }));
    }

    // -----------------------Common Functions-----------------------
    getRunSets = (runset, i) => {
        return `${runset.tool} ${runset.date} ${runset.niceName}`
    }  

    preparePlotValues = (el, tool, column) => {
        const col = this.tools[tool].columns[column];
        if (typeof el === 'string') {
            return col.source_unit === 's' ? +el.replace('s', '') : 
                    col.type.name === 'text' || col.type.name === 'main_status' ? el : +el;
        }
        else {
            return el;
        }
    }

    prepareTableValues = (el, tool, column, href, row) => {
        const col = this.tools[tool].columns[column];
        
        // table
        if (el && col.source_unit === "s") {
            return typeof el === 'string' ? (+el.replace('s', '')).toPrecision(3) : Math.round(+el);
        } else {
            if (typeof el === 'string' && (col.type.name === "main_status" || col.type.name === "status")) {
                return el ? <div className={row.category} onClick={href ? ev => this.toggleLinkOverlay(ev, href) : null} title="Click here to show output of tool">{el}</div> : null
            } else if(el) { // STATS
                return col.type.name === "text" ? el : +el;
            }
        }
    }

    changeTab = (event, column, tab) => {
        this.setState({
            tabIndex: tab,
            quantilePreSelection: column,
        })
    }
    // const firstVisibleCol = this.tools.map(tool => tool.columns).flat().find(col => col.isVisible).title;
    

    render() {
        
        return (
            <div className="App">
            <main>
                <div className="overview">
                    <Tabs selectedIndex={this.state.tabIndex} onSelect={tabIndex => this.setState({ tabIndex })}>
                        <TabList>
                            <Tab>Summary</Tab>
                            <Tab> Table </Tab>
                            <Tab> Quantile Plot </Tab>
                            <Tab> Scatter Plot </Tab>
                            <Tab> 
                                <button disabled={this.state.filtered.length>0 ? false : true} onClick={this.resetFilters}>Reset all Filters</button>
                                <a href="https://github.com/sosy-lab/benchexec" rel='noreferrer noopener' className="info">Number of Rows: {this.state.table.length}</a>
                            </Tab>
                        </TabList>
                        <TabPanel>
                            <Summary    
                                tools={this.state.tools}
                                tableHeader={this.tableHeader}
                                selectColumn={this.toggleSelectColumns}
                                stats = {this.stats}
                                prepareTableValues = {this.prepareTableValues}
                                changeTab= {this.changeTab} />
                        </TabPanel>
                        <TabPanel>
                            <Table      
                                tableHeader={this.tableHeader}
                                data={this.data}
                                tools={this.state.tools}
                                selectColumn={this.toggleSelectColumns}
                                getRunSets={this.getRunSets}
                                prepareTableValues = {this.prepareTableValues}
                                setFilter = {this.setFilter}
                                filterPlotData = {this.filterPlotData}
                                filtered = {this.state.filtered}
                                toggleLinkOverlay={this.toggleLinkOverlay}
                                changeTab= {this.changeTab} />
                        </TabPanel>
                        <TabPanel>
                            <QuantilePlot 
                                table={this.state.table}
                                tools={this.state.tools}
                                preSelection={this.state.quantilePreSelection}
                                preparePlotValues = {this.preparePlotValues}
                                getRunSets={this.getRunSets} />
                        </TabPanel>
                        <TabPanel>
                            <ScatterPlot 
                                table={this.state.table}
                                columns={this.columns}
                                tools={this.state.tools}
                                getRunSets={this.getRunSets}
                                preparePlotValues = {this.preparePlotValues} />
                        </TabPanel>
                        <TabPanel>
                            <p>Info and Links</p>
                        </TabPanel>
                    </Tabs>
                </div>
                <div> 
                    {this.state.showSelectColumns ? <SelectColumn 
                                                    close={this.toggleSelectColumns}
                                                    select={this.selectColumns}
                                                    currColumns = {this.state.columns}
                                                    tableHeader = {this.tableHeader}
                                                    getRunSets={this.getRunSets}
                                                    tools={this.state.tools} /> : null }
                    {this.state.showLinkOverlay ? <LinkOverlay 
                                                    close={this.toggleLinkOverlay}
                                                    link={this.state.link}
                                                    toggleLinkOverlay={this.toggleLinkOverlay} /> : null } 
                </div>
            </main>
            </div>
        );
    }
}

  