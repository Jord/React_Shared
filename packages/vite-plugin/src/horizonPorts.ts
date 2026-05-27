import type {HorizonApplicationCode} from "@horizon/config";

export const horizonPorts: Partial<Record<HorizonApplicationCode, number>> = {
    "access-control": 7006,
    "auth": 7009,
    "companies": 7027,
    "dms": 7003,
    "error-logs": 7005,
    "file-management": 7007,
    "globals": 7025,
    "jm-face-scan-reports": 7029,
    "jm-reporting": 7023,
    "project-hub": 7032,
    "project-hub-email-and-docs": 7016,
    "project-summaries": 7030,
    "project-references": 7011,
    "report-scheduler": 7028,
    "server-configuration": 7017,
    "sidebar-data-portal": 7040,
    "sky-project-costing": 7008,
    "stamping": 7018,
    "timesheets": 7020,
};
