// This file is part of BenchExec, a framework for reliable benchmarking:
// https://github.com/sosy-lab/benchexec
//
// SPDX-FileCopyrightText: 2019-2020 Dirk Beyer <https://www.sosy-lab.org>
//
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import QuantilePlot from "../components/QuantilePlot.js";
import Overview from "../components/Overview";
import renderer from "react-test-renderer";
import { constructHashURL } from "../utils/utils";
const fs = require("fs");

/*
 * A testing utility function to set the URL parameters for the test.
 * This is used instead of the setURLParameter function from the utils.js file
 * because the latter doesn't work well with the react-test-renderer.
 *
 * @param {Object} params - The parameters to set in the URL
 * @returns {void}
 */
const updateURLParams = (params) => {
  const { newUrl } = constructHashURL(window.location.href, params);
  window.history.pushState({}, "Quantile Plot Test", newUrl);
};

const testDir = "../test_integration/expected/";
const files = ["big-table.diff.html", "rows-with-scores.html"];
files
  .map((fileName) => ({
    fileName,
    content: fs.readFileSync(testDir + fileName, {
      encoding: "UTF-8",
    }),
  }))
  .forEach((fileData) => {
    describe("Quantile Plot tests for file " + fileData.fileName, () => {
      const data = JSON.parse(fileData.content);
      const overviewInstance = renderer
        .create(<Overview data={data} />)
        .getInstance();

      // Fixed width and height because the FlexibleXYPlot doesn't work well with the react-test-renderer
      const quantilePlotJSX = (
        <QuantilePlot
          table={overviewInstance.state.tableData}
          tools={overviewInstance.state.tools}
          preSelection={overviewInstance.state.quantilePreSelection}
          getRowName={overviewInstance.getRowName}
          hiddenCols={overviewInstance.state.hiddenCols}
          isFlexible={false}
        />
      );
      const plot = renderer.create(quantilePlotJSX);
      const plotInstance = plot.getInstance();

      const typesOfCols = plotInstance.possibleValues.map((col) => col.type);
      /* Objects of all first occuring columns with an unique type attribute as well as all runsets.
         Overriding of toString() method is used for better identifying test cases. */
      const selectionOptions = plotInstance.possibleValues
        .filter((col, index, self) => typesOfCols.indexOf(col.type) === index)
        .map((col) => ({
          value: col.display_title,
          toString: () => col.type,
        }))
        .concat(
          plotInstance.props.tools.map((tool) => ({
            value: "runset-" + tool.toolIdx,
            toString: () => "runset",
          })),
        );
      const resultOptions = Object.values(plotInstance.resultsOptions);

      // Array of pairs of selection and shown results as test data
      const selectionResultInput = selectionOptions.flatMap((selection) =>
        resultOptions.map((result) => [selection, result]),
      );

      describe("Quantile Plot should match HTML snapshot", () => {
        updateURLParams({ plot: plotInstance.plotOptions.quantile });

        it.each(selectionResultInput)(
          "with selection of the type %s and %s results",
          (selection, results) => {
            updateURLParams({ selection: selection.value, results });

            plotInstance.refreshUrlState();
            expect(plot).toMatchSnapshot();
          },
        );
      });

      describe("Direct Plot should match HTML snapshot", () => {
        updateURLParams({ plot: plotInstance.plotOptions.direct });

        it.each(selectionResultInput)(
          "with selection of the type %s and %s results",
          (selection, results) => {
            updateURLParams({ selection: selection.value, results });

            plotInstance.refreshUrlState();
            expect(plot).toMatchSnapshot();
          },
        );
      });

      // Score based plot isn't available if the data doesn't support a scoring scheme
      if (plotInstance.plotOptions.scoreBased) {
        describe("Score-based Quantile Plot should match HTML snapshot (if it exists)", () => {
          updateURLParams({ plot: plotInstance.plotOptions.scoreBased });

          // Only test with columns as runsets can't be selected for score-based plots
          it.each(
            selectionOptions.filter(
              (selection) => selection.toString() !== "runset",
            ),
          )("with selection of the type %s", (selection) => {
            updateURLParams({ selection: selection.value });

            plotInstance.refreshUrlState();
            expect(plot).toMatchSnapshot();
          });
        });
      }
    });
  });
