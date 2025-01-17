import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { wrapper } from "axios-cookiejar-support";
export interface Phone {
  phoneType: any;
  phoneNumber: string;
  isDefault: boolean;
}

export interface DefaultSite {
  id: number;
  address: string;
  name: any;
  postalCode: string;
  city: string;
  country: string;
  timezone: string;
  state: any;
  voltalisVersion: string;
  installationDate: string;
  dataStart: string;
  hasGlobalConsumptionMeasure: boolean;
  hasDsoMeasure: boolean;
  default: boolean;
}

export interface DisplayGroup {
  name: string;
  rights: Right[];
  resources: Resources;
}

export interface Right {
  name: string;
  enabled: boolean;
  type: string;
}

export interface Resources {
  favicon: string;
  fontcolor: string;
  logo: string;
  headercolor: string;
  secondarycolor: string;
  primarycolor: string;
  font: string;
}

export interface ManagedAppliances {
  id: number;
  name: string;
  applianceType: string;
  modulatorType: string;
  availableModes: string[];
  voltalisVersion: string;
  programming: Programming;
  heatingLevel: number;
}

export interface Programming {
  progType: string;
  progName: string;
  idManualSetting: any;
  isOn: boolean;
  untilFurtherNotice: any;
  mode: string;
  idPlanning: number;
  endDate: any;
  temperatureTarget: number;
  defaultTemperature: number;
}

export interface manualSettings {
  id: number;
  enabled: boolean;
  idAppliance: number;
  applianceName: string;
  applianceType: string;
  untilFurtherNotice: boolean;
  mode: string;
  heatingLevel: number;
  endDate: string;
  temperatureTarget: number;
  isOn: boolean;
}

export interface VoltalisConsumption {
  aggregationStepInSeconds: number;
  consumptions: Consumption[];
}

export interface Consumption {
  stepTimestampInUtc: string;
  totalConsumptionInWh: number;
  totalConsumptionInCurrency: number;
}

export class Voltalis {
  private credentials: Record<string, unknown>;
  public user: {
    token: string;
    oldMyVoltalisUrl: any;
    subscriber: {
      siteList: string;
    };
  } | null = null;
  public me: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    phones: Phone[];
    defaultSite: DefaultSite;
    otherSites: any[];
    displayGroup: DisplayGroup;
    firstConnection: boolean;
    migratedUser: boolean;
  } | null = null;
  public managedAppliances: ManagedAppliances[] | null = null;
  public manualSettings: manualSettings[] | null = null;
  public voltalisConsumption: VoltalisConsumption | null = null;
  private api: AxiosInstance;

  constructor(login: string, password: string) {
    this.credentials = {
      login,
      password,
    };

    this.api = wrapper(
      axios.create({
        withCredentials: true,
        baseURL: "https://api.myvoltalis.com/",
      }),
    );

    this.api.interceptors.request.use((config) => {
      if (this.isLoggedIn()) {
        if (config.headers === undefined) {
          config.headers = {};
        }
        config.headers["Authorization"] = "Bearer " + this.getToken();
      }
      return config;
    });
  }

  isLoggedIn() {
    return this.user !== null;
  }

  ensureIsLoggedIn() {
    if (!this.isLoggedIn()) {
      throw new Error("Use .login() first");
    }
  }

  getToken() {
    this.ensureIsLoggedIn();
    return this.user!.token;
  }
  getManagedAppliances() {
    return this.managedAppliances;
  }
  getManualSettings() {
    return this.manualSettings;
  }
  getManualSetting(id: number) {
    return this.manualSettings?.find((setting) => setting.id === id);
  }
  async login() {
    let res;
    try {
      res = await this.api.post("/auth/login", this.credentials);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        this.user = null;

        if (err.response) {
          if (err.response.status === 401) {
            throw new Error("Bad Credentials");
          }
        }
        console.error(err?.response);
        throw new Error("Unable to login");
      }

      throw err;
    }
    this.user = res.data;
    return this.user;
  }

  async fetchConsumptionInWh() {
    let res;
    try {
      res = await this.api.get(
        "api/site/" +
          this.me?.defaultSite.id +
          "/consumption/realtime?mode=TEN_MINUTES&numPoints=1",
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        this.user = null;

        if (err.response) {
          if (err.response.status === 401) {
            throw new Error("Bad Credentials");
          }
        }

        console.error(err?.response);
        throw new Error("Unable to login");
      }

      throw err;
    }
    this.voltalisConsumption = res.data;
    return res.data;
  }

  async fetchMe() {
    let res;
    try {
      res = await this.api.get("/api/account/me");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        this.user = null;

        if (err.response) {
          if (err.response.status === 401) {
            throw new Error("expired token");
          }
        }

        console.error(err?.response);
        throw new Error("Unable to fetch account details");
      }

      throw err;
    }

    this.me = res.data;
    return this.me;
  }

  async fetchManagedAppliances() {
    let res;
    try {
      res = await this.api.get(
        "api/site/" + this.me?.defaultSite.id + "/managed-appliance",
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        this.user = null;

        if (err.response) {
          if (err.response.status === 401) {
            throw new Error("expired token");
          }
        }

        console.error(err?.response);
        throw new Error("Unable to fetch appliances");
      }

      throw err;
    }

    this.managedAppliances = res.data;
    return this.managedAppliances;
  }

  async fetchmanualSettings() {
    let res;
    try {
      res = await this.api.get(
        "api/site/" + this.me?.defaultSite.id + "/manualsetting",
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        this.user = null;

        if (err.response) {
          if (err.response.status === 401) {
            throw new Error("expired token");
          }
        }

        console.error(err?.response);
        throw new Error("Unable to fetch manual settings");
      }

      throw err;
    }

    this.manualSettings = res.data;
    return true;
  }

  async putmanualSetting(url: string, body: string) {
    let res;
    const id = Number(url.split("/").at(2));
    let mode;

    if (typeof body === "string") {
      mode = JSON.parse(body).mode;
    }

    try {
      const idAppliance = this.getManualSetting(id)?.idAppliance;
      const body = {
        enabled: true,
        endDate: null,
        idAppliance: idAppliance,
        isOn: true,
        mode: mode,
        temperatureTarget: 20.5,
        untilFurtherNotice: true,
      };
      res = await this.api.put(
        "api/site/" + this.me?.defaultSite.id + "/manualsetting/" + id,
        body,
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        this.user = null;

        if (err.response) {
          if (err.response.status === 401) {
            throw new Error("expired token");
          }
        }

        console.error(err?.response);
        throw new Error("Unable to post manual settings " + mode);
      }

      throw err;
    }

    this.fetchmanualSettings();
    return true;
  }
}
