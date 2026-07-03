"use client";

import { USER_SOURCE_OPTIONS } from "@/lib/bookingSource";
import {
  Paper,
  Box,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { Search, X } from "lucide-react";

// Extracted verbatim from user-management/page.jsx. Behaviour unchanged.
export default function UserFiltersPanel({
  agentFollowUpFilterLabel,
  agents,
  assigneeFilter,
  clearFilters,
  conversationStageFilter,
  customEndDate,
  customStartDate,
  filterDate,
  filterStatus,
  followUpFilter,
  franchiseLeadsFilter,
  handleConversationStageFilterChange,
  handleSearch,
  isAgent,
  leadSourceFilter,
  leadStageFilter,
  leadStatusFilter,
  remarkCountFilter,
  role,
  searchQuery,
  setAssigneeFilter,
  setCustomEndDate,
  setCustomStartDate,
  setFilterDate,
  setFranchiseLeadsFilter,
  setLeadSourceFilter,
  setLeadStageFilter,
  setLeadStatusFilter,
  setRemarkCountFilter,
  setSearchQuery,
  stageOptions,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        p: { xs: 1, sm: 1.25 },
        mb: 1,
        backgroundColor: "#f8fafc",
      }}
    >
      {isAgent && followUpFilter !== "all" && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold bg-gradient-to-r from-rose-50 via-indigo-50 to-indigo-50 text-indigo-900 border border-indigo-200/70 shadow-sm">
            <span className="text-indigo-600/90">Table filter:</span>
            <span className="text-rose-700">{agentFollowUpFilterLabel}</span>
          </span>
        </div>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          "& .MuiOutlinedInput-root": {
            height: 38,
            borderRadius: "10px",
            backgroundColor: "#fff",
          },
          "& .MuiInputBase-input": {
            py: "7px",
            fontSize: 14,
          },
          "& .MuiSelect-select": {
            py: "7px",
            fontSize: 14,
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(0, 3fr) minmax(150px, 1fr)",
            },
            alignItems: "stretch",
            gap: 1,
            width: "100%",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flex: 1,
              minWidth: 0,
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Search email, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              aria-label="Search users"
              sx={{
                height: 38,
                minWidth: { xs: 44, sm: 104 },
                px: { xs: 1.25, sm: 2 },
                borderRadius: "0 10px 10px 0",
                textTransform: "none",
                fontWeight: 800,
                boxShadow: "none",
                gap: 0.75,
              }}
            >
              <Search size={16} />
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                Search
              </Box>
            </Button>
          </Box>

          <FormControl size="small" fullWidth>
            <Select
              displayEmpty
              value={leadStageFilter}
              onChange={(e) => setLeadStageFilter(e.target.value)}
              renderValue={(selected) =>
                selected === "All" ? "Stage: All" : `Stage: ${selected}`
              }
              inputProps={{ "aria-label": "Lead Stage" }}
            >
              <MenuItem value="All">All Stages</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Follow Up">Follow Up</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Onboard">Onboard</MenuItem>
              <MenuItem value="Expired"> Expired Onboard Plan </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
              xl: "repeat(4, minmax(150px, 1fr)) auto",
            },
            gap: 1,
            alignItems: "center",
          }}
        >
          {(role === "superAdmin" ||
            role === "admin" ||
            role === "superfranchiseAdmin") && (
            <>
              <FormControl size="small" fullWidth>
                <Select
                  displayEmpty
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  renderValue={(selected) => {
                    if (selected === "All") return "Agent: All";
                    if (selected === "Unassigned") return "Agent: Unassigned";
                    const agent = agents.find((a) => a._id === selected);
                    return `Agent: ${agent?.fullName || "Selected"}`;
                  }}
                  inputProps={{ "aria-label": "Assign To" }}
                >
                  <MenuItem value="All">All Agents</MenuItem>
                  <MenuItem value="Unassigned">Unassigned</MenuItem>
                  {agents.map((agent) => (
                    <MenuItem key={agent._id} value={agent._id}>
                      {agent.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {(role === "superAdmin" ||
                role === "admin" ||
                role === "superfranchiseAdmin") && (
                <FormControl size="small" fullWidth>
                  <Select
                    displayEmpty
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value)}
                    renderValue={(selected) =>
                      selected === "All" ? "Status: All" : `Status: ${selected}`
                    }
                    inputProps={{ "aria-label": "Lead Status" }}
                  >
                    <MenuItem value="All">All Lead Status</MenuItem>
                    <MenuItem value="Hot">Hot Leads</MenuItem>
                    <MenuItem value="Warm">Warm Leads</MenuItem>
                    <MenuItem value="Cold">Cold Leads</MenuItem>
                    <MenuItem value="Untagged">None</MenuItem>
                  </Select>
                </FormControl>
              )}
            </>
          )}

          <FormControl size="small" fullWidth>
            <Select
              displayEmpty
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              renderValue={(selected) =>
                selected === "All" ? "Date: All Time" : `Date: ${selected}`
              }
              inputProps={{ "aria-label": "Date Range" }}
            >
              <MenuItem value="All">All Time</MenuItem>
              <MenuItem value="Today">Today</MenuItem>
              <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
              <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
              <MenuItem value="This Month">This Month</MenuItem>
              <MenuItem value="Custom Range">Custom Range</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <Select
              displayEmpty
              value={leadSourceFilter}
              onChange={(e) => setLeadSourceFilter(e.target.value)}
              renderValue={(selected) => {
                if (selected === "All") return "Source: All";
                const option = USER_SOURCE_OPTIONS.find(
                  (item) => item.value === selected,
                );
                return `Source: ${option?.label || selected}`;
              }}
              inputProps={{ "aria-label": "Lead Source" }}
            >
              <MenuItem value="All">All Sources</MenuItem>
              {USER_SOURCE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <Select
              displayEmpty
              value={remarkCountFilter}
              onChange={(e) => setRemarkCountFilter(e.target.value)}
              renderValue={(selected) => {
                if (selected === "All") return "Remark: All";
                if (selected === "None") return "Remark: 0";
                if (selected === "More") return "Remark: More";
                return `Remark: ${selected}`;
              }}
              inputProps={{ "aria-label": "Remark Count" }}
            >
              <MenuItem value="All">All Remarks</MenuItem>
              <MenuItem value="None">No Remark</MenuItem>
              <MenuItem value="1">Remark 1</MenuItem>
              <MenuItem value="2">Remark 2</MenuItem>
              <MenuItem value="3">Remark 3</MenuItem>
              <MenuItem value="More">More</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={conversationStageFilter}
              onChange={(e) =>
                handleConversationStageFilterChange(e.target.value)
              }
              displayEmpty
            >
              <MenuItem value="All">All Stages</MenuItem>
              {stageOptions.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {stage}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              height: 38,
              padding: "0 8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: franchiseLeadsFilter ? "#e3f2fd" : "transparent",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
            onClick={() => setFranchiseLeadsFilter(!franchiseLeadsFilter)}
          >
            <input
              type="checkbox"
              checked={franchiseLeadsFilter}
              onChange={(e) => setFranchiseLeadsFilter(e.target.checked)}
              style={{ cursor: "pointer", width: 18, height: 18 }}
            />
            <label style={{ cursor: "pointer", fontSize: "14px", margin: 0 }}>
              Franchise Leads
            </label>
          </Box>

          {filterDate === "Custom Range" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                gridColumn: { xs: "1 / -1", md: "span 2" },
              }}
            >
              <TextField
                size="small"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                fullWidth
              />
              <span className="text-sm text-gray-500">to</span>
              <TextField
                size="small"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                fullWidth
              />
            </Box>
          )}

          {(searchQuery ||
            filterStatus !== "All" ||
            filterDate !== "All" ||
            assigneeFilter !== "All" ||
            leadStatusFilter !== "All" ||
            leadStageFilter !== "All" ||
            leadSourceFilter !== "All" ||
            conversationStageFilter !== "All" ||
            remarkCountFilter !== "All" ||
            franchiseLeadsFilter) && (
            <Button
              onClick={clearFilters}
              variant="outlined"
              color="inherit"
              startIcon={<X size={16} />}
              sx={{
                height: 38,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
