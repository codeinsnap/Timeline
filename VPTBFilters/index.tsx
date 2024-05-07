import React, { useEffect, useRef, useState } from "react";
import { dashboardHeaderStyle } from "@/components/Layout/DashboardHeader/dashboard_header_tailwind";
import MultiSelect from "@/components/Shared/MultiSelect";
import { useDispatch, useSelector } from "react-redux";
import { vptb_filters_tailwind } from "./vptb_filters_tailwind";
import { fetchVehiceTrackingBoardFilterAction } from "@/store/actions/vehicleAccessTrackingBoardAction";
import moment from "moment";

interface SelectData {
  val: string,
  name: string,
  checked?: boolean
}

interface VINData {
  line: string,
  name: string,
  stall: string,
  vin: string,
  status: string,
  member: string
}

import { CONSTANTS } from "@/constants/constants";
import { TSelectedFilters } from "../GnattChart/gnatt_chart_types";

type TVPTBFiltersProps = {
  setFilters: ( filters : TSelectedFilters) => void
  applyFilters: () => void
  handleResetFilter: () => void
}

export default function VPTBFilters({ handleResetFilter, setFilters, applyFilters } : TVPTBFiltersProps) {
  const [timeToggleEle, setTimeToggle] = useState([
    { name: '60min', value: '60', label: 'By Hour', isActive: true },
    { name: '15min', value: '15', label: 'By 15 Minutes', isActive: false },
    { name: '1min', value: '1', label: 'By Minute', isActive: false }
  ]);
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');

  const dispatch: any = useDispatch();
  const apiData = useSelector((state: any) => state.vehilceProgress.vehicleFilterData);

  const [prodLineList, setProdLineList] = useState<SelectData[]>([]);
  const [stallList, setStallList] = useState<SelectData[]>([]);
  const [vinList, setVINList] = useState<SelectData[]>([]);
  const [statusList, setStatusList] = useState<SelectData[]>([]);
  const [memberList, setMemberList] = useState<SelectData[]>([]);

  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [selectedStalls, setSelectedStalls] = useState<string[]>([]);
  const [selectedVins, setSelectedVins] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const multiSelectApis = useRef<any>({});

  const handleShowApplyBtn = () => {
    if (fromTime || toTime || selectedLines?.length > 0 || selectedVins?.length > 0 || selectedMembers?.length > 0 || selectedStatus?.length > 0 ||  selectedStalls?.length > 0 ) return false
    return true
  }

  useEffect(() =>{ setFilters({fromTime, toTime, selectedLines,selectedVins,selectedMembers,selectedStatus, selectedStalls})} ,[fromTime, toTime, selectedLines,selectedVins,selectedMembers,selectedStatus, selectedStalls])
  const resetFilters = () => {
    setSelectedLines([])
    handleResetFilter()
    setFromTime('')
    setToTime('')
    setSelectedVins([]);
    setSelectedStalls([])
    handleCloseAllMultiSelectDropdowns();
  }

  const handleApplyFilters = () => {
    if(applyFilters) applyFilters();
    handleCloseAllMultiSelectDropdowns();
  }

  const handleCloseAllMultiSelectDropdowns = () => {
    Object.keys(multiSelectApis.current).forEach((key)=>{
      multiSelectApis.current[key].setExpanded(false);
    })
  }

  // const apiData = [
  //   { line: 'A1', name: 'Wheels', stall: '1', vin: "JTERU5JR9R6254771", status: "P", member: 'abc' },
  //   { line: 'A1', name: 'Align', stall: '2', vin: "JTERU5JR9R6252341", status: "E", member: 'bxy' },
  //   { line: 'B', name: 'Bayer', stall: '3', vin: "JTERU5JR9R6251231", status: "P", member: 'sdq' },
  //   { line: 'C', name: 'Bayer', stall: '4', vin: "JTERU5JR9R6253241", status: "E", member: '124' },
  //   { line: 'D', name: 'Hoist', stall: '5', vin: "JTERU5JR9R6256531", status: "P", member: '125' },
  //   { line: 'E1', name: 'Roof', stall: '6', vin: "JTERU5JR9R6253421", status: "P", member: '432' }
  // ];

  const populateSelectData = (data: VINData[]) => {
    if (data && Array.isArray(data)) {
      const lines = new Set<string>;
      const stalls = new Set<string>;
      const vins = new Set<string>;
      const statuses = new Set<string>;
      const members = new Set<string>;
      const lineList: SelectData[] = [];
      const stallList: SelectData[] = [];
      const vinList: SelectData[] = [];
      const statusList: SelectData[] = [];
      const memberList: SelectData[] = [];
      data.forEach(vinInfo => {
        let lineId = vinInfo.line;
        let name = vinInfo.name;
        let stallId = lineId + '_' + vinInfo.stall;
        let vinId = stallId + '_' + vinInfo.vin;
        let lineSelected = selectedLines.indexOf(lineId) > -1;
        let stallSelected = selectedStalls.indexOf(stallId) > -1;
        if (!lines.has(lineId)) {
          // new line. Add to the line list
          lineList.push({
            val: lineId,
            name: lineId + ' - ' + name,
            checked: selectedLines.indexOf(lineId) !== -1
          })
          lines.add(lineId);
        }
        // populate stalls only if a line is selected
        if (lineSelected && !stalls.has(vinInfo.line + '_' + vinInfo.stall)) {
          stallList.push({
            val: stallId,
            name: vinInfo.line + ' Stall ' + vinInfo.stall,
            checked: selectedStalls.indexOf(stallId) !== -1
          })
          stalls.add(vinInfo.line + '_' + vinInfo.stall);
        }
        // display all vins if line is not selected else only the vins for the line
        if (!vins.has(vinId) && (lineSelected || selectedLines.length === 0) && (stallSelected || selectedStalls.length === 0)) {
          if (stallSelected && lineSelected) {
              if (selectedLines.includes(lineId) && selectedStalls.includes(stallId)) {
                if (!vinList.find(v => v.name === vinInfo.vin)) {
                  vinList.push({
                    val: vinId,
                    name: vinInfo.vin,
                    checked: selectedVins.indexOf(vinId) !== -1
                  });
                }
                  vins.add(vinId);
              }
          } else if (lineSelected && selectedLines.includes(lineId)) {
            if (!vinList.find(v => v.name === vinInfo.vin)) {
              vinList.push({
                val: vinId,
                name: vinInfo.vin,
                checked: selectedVins.indexOf(vinId) !== -1
              });
            }
              vins.add(vinId);
          } else if (!lineSelected && selectedLines.length === 0) {
            if (!vinList.find(v => v.name === vinInfo.vin)) {
              vinList.push({
                val: vinId,
                name: vinInfo.vin,
                checked: selectedVins.indexOf(vinId) !== -1
              });
            }
              vins.add(vinId);
          }
        }
        if (!vins.has(vinId) && (lineSelected || selectedLines.length === 0) && (stallSelected || selectedStalls.length === 0)) {
          if (stallSelected && lineSelected) {
              if (selectedLines.includes(lineId) && selectedStalls.includes(stallId)) {
                  vinList.push({
                      val: vinId,
                      name: vinInfo.vin,
                      checked: selectedVins.indexOf(vinId) !== -1
                  });
                  vins.add(vinId);
              }
          } else if (lineSelected && selectedLines.includes(lineId)) {
              vinList.push({
                  val: vinId,
                  name: vinInfo.vin,
                  checked: selectedVins.indexOf(vinId) !== -1
              });
              vins.add(vinId);
          } else if (!lineSelected && selectedLines.length === 0) {
              vinList.push({
                  val: vinId,
                  name: vinInfo.vin,
                  checked: selectedVins.indexOf(vinId) !== -1
              });
              vins.add(vinId);
          }
      }
        if ((stallSelected || lineSelected || selectedLines.length === 0) && !statuses.has(vinInfo.status)) {
          statusList.push({
            val: vinInfo.status,
            name: vinInfo.status,
            checked: selectedStatus.indexOf(vinInfo.status) !== -1
          })
          statuses.add(vinInfo.status);
        }
        if ((stallSelected || lineSelected || selectedLines.length === 0) && !members.has(vinInfo.member)) {
          memberList.push({
            val: vinInfo.member,
            name: vinInfo.member,
            checked: selectedMembers.indexOf(vinInfo.member) !== -1
          })
          members.add(vinInfo.member);
        }
      });
      setProdLineList(sortFilterValues(lineList));
      setStallList(sortFilterValues(stallList));
      setVINList(sortFilterValues(vinList));
      setMemberList(sortFilterValues(memberList));
      setStatusList(sortFilterValues(statusList));
    }
  };

  const sortFilterValues = (x: SelectData[]) => {
    return x.sort((p1: SelectData, p2: SelectData) => {
      const numericRegex = /^(\D*)(\d*)$/;
      let a = p1.name;
      let b = p2.name;
      if (a === "ALL") return -1;
      if (b === "ALL") return 1;

      const aMatch = numericRegex.exec(a);
      const bMatch = numericRegex.exec(b);
      if (a > b && aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }else if(bMatch){
          return 1;

      } else if (a < b && aMatch) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  useEffect(() => {
    populateSelectData(apiData);
  }, [selectedLines, selectedStalls, selectedVins, selectedMembers, selectedStatus, apiData]);

  useEffect(() => {
    dispatch(fetchVehiceTrackingBoardFilterAction(moment.tz('America/Los_Angeles').format('YYYY-MM-DD')));
  }, []);

  const manageToggle = (value: string) => {
    let updatedTimeToggleData = timeToggleEle.map((timeOption) => {
      timeOption.value === value ? timeOption.isActive = true : timeOption.isActive = false;
      return timeOption;
    });
    setTimeToggle(updatedTimeToggleData);
  };

  const shift_option = [
    { val: "Shift_1", name: "Shift 1", checked: true },
    { val: "Shift_2", name: "Shift 2" }
  ];

  const removeElementFromArray = (arr: string[], val: string) => {
    let tempArr = [...arr];
    tempArr.splice(tempArr.indexOf(val), 1);
    return [...tempArr];
  }

  const handleFiltering = (event: any) => {
    let name = event.target.name;
    let value = event.target.value;
    let checked = event.target.checked;
    switch (name) {
      case 'line':
        if (checked) {
          setSelectedLines(Array.from(new Set ([...selectedLines, value])))
        } else {
          setSelectedLines(removeElementFromArray(selectedLines, value));
        }
        break;
      case 'stall':
        if (checked) {
          setSelectedStalls(Array.from(new Set ([...selectedStalls, value])));
          //setSelectedLines([...selectedLines, value.split('_')[0]])
        } else {
          setSelectedStalls(removeElementFromArray(selectedStalls, value));
        }
        break;
      case 'vin':
        if (checked) {
          setSelectedVins([...selectedVins, value])
          // setSelectedStalls([...selectedStalls, value.split('_')[0] + '_' + value.split('_')[1]]);
          // setSelectedLines([...selectedLines, value.split('_')[0]])
          //setSelectedStalls(Array.from(new Set ([...selectedStalls, value.split('_')[0] + '_' + value.split('_')[1]])));
          //setSelectedLines(Array.from(new Set ([...selectedLines, value.split('_')[0]])));
        } else {
          setSelectedVins(removeElementFromArray(selectedVins, value));
        }
        break;
      case 'status':
        checked ? setSelectedStatus([...selectedStatus, value]) : setSelectedStatus(removeElementFromArray(selectedStatus, value));
        break;
      case 'member':
        checked ? setSelectedMembers([...selectedMembers, value]) : setSelectedMembers(removeElementFromArray(selectedMembers, value));
        break;
      default:
        break;
    }
  }

  /**
   * Functiom to Get the Time Series
   * @returns Array of Time Series
   */
  function getFromTime(): Array<string> {
    let startTime = moment().startOf('date');
    const timeSeries = [];
    for (let index = 0; index < 24 * 2; index++) {
      startTime = moment(startTime).add(30, 'minutes');
      if (startTime.format(CONSTANTS.HOUR_24FORMAT) === '00:00') {
        timeSeries.push('24:00');
      } else {
        timeSeries.push(startTime.format(CONSTANTS.HOUR_24FORMAT));
      }
    }
    timeSeries.unshift(startTime.format(CONSTANTS.HOUR_24FORMAT));
    return timeSeries;
  }

  /**
   * Function to Get the To Time Series
   * @returns Array string
   */
  function getToTime() {
    if (fromTime) {
      const timeSeries = getFromTime();
      const idx = timeSeries.indexOf(fromTime);
      return timeSeries.slice(idx + 1);
    } else {
      return null
    }
  }

  /**
   * Function to Handle the From Time On Change
   * @param event 
   */
  const fromTimeChange = (event: any) => {
    const value = event?.target?.value;
    setToTime('');
    setFromTime(value);
  }

  /**
   * Function to Handle the To Time change
   * @param event 
   */
  const toTimeChange = (event: any) => {
    const value = event?.target?.value;
    setToTime(value)
  }

  const handleSelectDeselectAll = (event: any) => {
    let name = event.target.name;
    let checked = event.target.checked;
    switch (name) {
      case 'line':
        checked ? setSelectedLines(prodLineList.map(line => line.val)) : setSelectedLines([]);
        break;
      case 'stall':
        checked ? setSelectedStalls(stallList.map(stall => stall.val)) : setSelectedStalls([]);
        break;
      case 'vin':
        checked ? setSelectedVins(vinList.map(vin => vin.val)) : setSelectedVins([]);
        break;
      case 'status':
        checked ? setSelectedStatus(statusList.map(status => status.val)) : setSelectedStatus([]);
        break;
      case 'member':
        checked ? setSelectedMembers(memberList.map(member => member.val)) : setSelectedMembers([]);
        break;
      default:
        break;
    }
  };

  return (
    <div className={vptb_filters_tailwind.filterWrapper}>
      <div className={vptb_filters_tailwind.filter}>
        <label>
          <div className={vptb_filters_tailwind.filterMargin}>Shift</div>
          <MultiSelect
            name="shift"
            option={shift_option}
            placeholder="Select shift"
            handleChange={handleFiltering}
            handleSelectDeselectAll={handleSelectDeselectAll}
            searchable={true}
            ignoreCase={true}
            getMultiSelectApis={(apis:any)=> multiSelectApis.current['shift']=apis}
          />
        </label>
      </div>
      <div className={vptb_filters_tailwind.filter}>
        <label>
          <div className={vptb_filters_tailwind.filterMargin}>Line</div>
          <div className ={`${selectedLines.length > 0 ? 'border-4 border-blue-700' : ''}`}>
          <MultiSelect
            name="line"
            option={prodLineList}
            placeholder="Select Line"
            handleChange={handleFiltering}
            handleSelectDeselectAll={handleSelectDeselectAll}
            searchable={true}
            ignoreCase={true}
            getMultiSelectApis={(apis:any)=> multiSelectApis.current['line']=apis}
          />
          </div>
        </label>
      </div>
      <div className={vptb_filters_tailwind.filter}>
        <label>
          <div className={vptb_filters_tailwind.filterMargin}>Stall/Pitch</div>
          <div className ={`${((selectedStalls.length > 0) && (stallList.length > 0)) ? 'border-4 border-blue-700' : ''}`}>
          <MultiSelect
            name="stall"
            option={stallList}
            placeholder="Select Stall"
            handleChange={handleFiltering}
            handleSelectDeselectAll={handleSelectDeselectAll}
            searchable={true}
            ignoreCase={true}
            getMultiSelectApis={(apis:any)=> multiSelectApis.current['stall']=apis}
          />
          </div>
        </label>
      </div>
      <div className={vptb_filters_tailwind.filter}>
        <label>
          <div className={vptb_filters_tailwind.filterMargin}>VIN</div>
          <div className ={`${selectedVins.length > 0 ? 'border-4 border-blue-700' : ''}`}>
          <MultiSelect
            name="vin"
            option={vinList}
            placeholder="Select VIN"
            handleChange={handleFiltering}
            handleSelectDeselectAll={handleSelectDeselectAll}
            searchable={true}
            ignoreCase={true}
            getMultiSelectApis={(apis:any)=> multiSelectApis.current['vin']=apis}
          />
          </div>
        </label>
      </div>
      <div className={vptb_filters_tailwind.filter}>
        <label>
          <div className={vptb_filters_tailwind.filterMargin}>Status</div>
          <div className ={`${selectedStatus.length > 0 ? 'border-4 border-blue-700' : ''}`}>
          <MultiSelect
            name="status"
            option={statusList}
            placeholder="Select Status"
            handleChange={handleFiltering}
            handleSelectDeselectAll={handleSelectDeselectAll}
            searchable={true}
            ignoreCase={true}
            getMultiSelectApis={(apis:any)=> multiSelectApis.current['status']=apis}
          />
         </div>
        </label>
      </div>

      <div className={vptb_filters_tailwind.filter}>
        <label>
          <div className={vptb_filters_tailwind.filterMargin}>Member Id</div>
          <div className ={`${selectedMembers.length > 0 ? 'border-4 border-blue-700' : ''}`}>
          <MultiSelect
            name="member"
            option={memberList}
            placeholder="Select Member Id"
            handleChange={handleFiltering}
            handleSelectDeselectAll={handleSelectDeselectAll}
            searchable={true}
            ignoreCase={true}
            getMultiSelectApis={(apis:any)=> multiSelectApis.current['member']=apis}
          />
          </div>
        </label>
      </div>
      <div className={vptb_filters_tailwind.filter}>
        <label>
          <div className={vptb_filters_tailwind.filterMargin}>Time Duration</div>
          <div className="flex flex-row">
            <select className={vptb_filters_tailwind.timeFilter}
              name="fromTime" onChange={fromTimeChange} required value={fromTime}
            >
              <option value="">From</option>
              {getFromTime()?.map((option: any) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select className={vptb_filters_tailwind.timeFilter}
              name="toTime" onChange={toTimeChange} required value={toTime}
            >
              <option value="">To</option>
              {getToTime()?.map((option: any) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </label>
      </div>
      <div className={vptb_filters_tailwind.actionBtnDiv}>
        <button disabled={handleShowApplyBtn()} onClick={handleApplyFilters} className={handleShowApplyBtn() ? vptb_filters_tailwind.disabledBtn : vptb_filters_tailwind.applyBtn}>Apply</button>
        <button onClick={resetFilters} className={vptb_filters_tailwind.applyBtn}>Reset</button>
      </div>
      <div className="w-full">
        <label>
          <div className="mb-2">Time</div>
          <div className={dashboardHeaderStyle.toggleBtn}>
            {timeToggleEle &&
              timeToggleEle.map((item: any) => {
                return (
                  <button
                    key={item.name}
                    name={item.name}
                    value={item.value}
                    className={
                      item.isActive
                        ? dashboardHeaderStyle.btnActive
                        : dashboardHeaderStyle.btnInActive
                    }
                    onClick={() => manageToggle(item.value)}
                  >
                    {item.label}
                  </button>
                );
              })}
          </div>
        </label>
      </div>

    </div>
  );
}
