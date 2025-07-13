import React from 'react';
import { TextField, Grid, Paper, Typography, Chip, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';

interface SearchAndFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allTelemetryTags: string[];
  activeTelemetryFilters: string[];
  toggleTelemetryFilter: (filter: string) => void;
  allSemconvTags: string[];
  activeSemconvFilters: string[];
  toggleSemconvFilter: (filter: string) => void;
  allTargetTags: string[];
  activeTargetFilters: string[];
  toggleTargetFilter: (filter: string) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  allTelemetryTags, 
  activeTelemetryFilters, 
  toggleTelemetryFilter, 
  allSemconvTags, 
  activeSemconvFilters, 
  toggleSemconvFilter,
  allTargetTags,
  activeTargetFilters,
  toggleTargetFilter
}) => {
  return (
    <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
      <Grid container spacing={4} justifyContent="space-around">
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Search
          </Typography>
          <TextField
            fullWidth
            label="Search by name..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Typography variant="h6" gutterBottom>
            Telemetry
          </Typography>
          <Paper variant="outlined" style={{ padding: '10px' }}>
            {allTelemetryTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                clickable
                color={activeTelemetryFilters.includes(tag) ? 'primary' : 'default'}
                onClick={() => toggleTelemetryFilter(tag)}
                style={{ marginRight: '10px', marginBottom: '0px' }}
              />
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Typography variant="h6" gutterBottom>
            Target
          </Typography>
          <Paper variant="outlined" style={{ padding: '10px' }}>
            {allTargetTags.map(tag => (
              <Chip
                key={tag}
                label={
                  <>
                    {tag === 'javaagent' && <SmartToyIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />}
                    {tag === 'library' && <LocalLibraryIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />}
                    {tag === 'javaagent' ? 'Java Agent' : tag === 'library' ? 'Library' : tag}
                  </>
                }
                clickable
                color={activeTargetFilters.includes(tag) ? 'primary' : 'default'}
                onClick={() => toggleTargetFilter(tag)}
                style={{ marginRight: '10px', marginBottom: '0px' }}
              />
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Semantic Conventions
          </Typography>
          <Paper variant="outlined" style={{ padding: '10px' }}>
            {allSemconvTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                clickable
                color={activeSemconvFilters.includes(tag) ? 'primary' : 'default'}
                onClick={() => toggleSemconvFilter(tag)}
                style={{ marginRight: '10px', marginBottom: '0px' }}
              />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SearchAndFilter;