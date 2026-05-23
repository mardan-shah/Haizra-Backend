

## 🏗️ System Architecture & Modularity

The backend enforces a strict decoupled data layer with explicit modular boundaries. The structure is broken down into four isolated operational tiers:



```
              ┌─────────────────────────────────────────┐
              │                   Ops                   │
              │   Scripts, configs, Nixpacks setup      │
              └────────────────────┬────────────────────┘
                                   │ Configures / Deploys
                                   ▼
              ┌─────────────────────────────────────────┐
              │                 Runtime                 │
              │        Bun Entrypoint [index.ts]        │
              └────────────────────┬────────────────────┘
                                   │ Routes To
                                   ▼
              ┌─────────────────────────────────────────┐
              │                API Layer                │
              │  Isolated resource-driven modules       │
              │  (Orders, Auctions, Storefronts, etc.)  │
              └────────────────────┬────────────────────┘
                                   │ Queries
                                   ▼
              ┌─────────────────────────────────────────┐
              │            Persistence Layer            │
              │  Drizzle Access, DB Migrations, Schemas │
              └─────────────────────────────────────────┘

```


### 1. Operations & Configuration Layer (`Ops`)
Manages runtime configuration, development tooling scripts, and automated orchestration files:
* `debug-schema.ts`: Operational script dedicated to inspecting and debugging generated SQL types and constraints.
* `reset-db.ts`: Utility pipeline for truncating/dropping testing environments and resetting persistent state securely.
* `nixpacks.toml`: Strict configuration definition ensuring deterministic, immutable containerized deployments across edge networks (such as Railway or Hetzner).
* `bunfig.toml` & `drizzle.config.ts`: Fine-tuning configuration for the Bun execution runtime engine and Drizzle toolchain schema outputs.

### 2. Core Entry Runtime (`Runtime`)
* `index.ts`: The unified system bootstrap and server entry point. Listens to initial network events and efficiently dispatches traffic across core application routers without binding presentation logic to business tiers.

### 3. Modular API Layer (`API`)
The endpoint design follows single-responsibility domain isolation. Each resource domain controls its own logic, interceptors, and relational data bindings:
* **Users API Module** (`users.ts`): Controls identification contexts, credentials, and profile state.
* **Products API Module** (`products.ts`): Serves items metadata, inventories, and catalog availability.
* **Orders API Module** (`orders.ts`): Orchestrates transit lifecycle, purchase pathways, and aggregator metrics.
* **Auctions API Module** (`auctions.ts`): Manages concurrent micro-bidding engine, real-time bid logic, and timers.
* **Reviews API Module** (`reviews.ts`): Handles user evaluations, rating constraints, and aggregations.
* **Storefronts API Module** (`storefronts.ts`): Coordinates vendor/merchant isolation, branding metadata, and tenant endpoints.

### 4. Database & Core Persistence Layer (`Persistence`)
The data tier maps out fully normalized, complex relational constraints with strict TypeScript compilation guards:
* `db.ts`: Unified client instance managing production database pooling configurations and queries execution limits.
* `migrate.ts`: Executable entry pipeline for processing live SQL structural diff sheets against the cloud instance.
* `schema/`: Declarative definitions establishing the source of truth for the platform. It surface-maps the following schemas:
  * `users.ts` & `addresses.ts`: User authentication tables and structural geographic localization maps.
  * `products.ts`, `orders.ts`, & `transactions.ts`: The core engine tables managing state changes, inventory allocations, and transaction values.
  * `auctions.ts` & `ratings.ts`: High-concurrency transaction tracking logs and score models.
  * `relations.ts`: Central declaration defining deep, complex relational joins across entities (e.g., One-to-Many, Many-to-Many) ensuring absolute clarity for multi-table queries.

---

## 🛠️ Technical Stack & Tooling

* **Runtime Environment:** [Bun](https://bun.sh/) — Chosen for its low-footprint HTTP performance, fast native TS processing, and advanced memory utilization over traditional Node environments.
* **Object-Relational Mapping:** [Drizzle ORM](https://orm.drizzle.team/) — Implemented for fully declarative SQL typing, zero-overhead execution metrics, and a production-grade migrations workflow.
* **Database Engine:** [PostgreSQL](https://www.postgresql.org/) — Highly transactional database tier chosen to reliably enforce complex foreign key cascading rules and concurrent indexing.
* **Containerization Engine:** [Nixpacks](https://nixpacks.com/) — Multi-stage, low-weight deployment template that builds reproducible images without heavy Dockerfile maintenance overhead.

---

## 🚀 Environment Setup & Deployment

### Local Development Installation
Ensure you have the latest **Bun** version configured on your machine.

1. **Clone the repository:**
```bash
git clone [https://github.com/mardan-shah/haizra-backend.git](https://github.com/mardan-shah/haizra-backend.git)
cd haizra-backend
```

2. **Install strict dependencies:**
```bash
bun install

```


3. **Environment Setup:**
Duplicate the template file and input your persistent credential strings:
```bash
cp .env.example .env

```


4. **Database Migrations Lifecycle:**
Generate clean SQL schemas matching the declarative files and push migrations:
```bash
bun drizzle-kit generate
bun run src/db/migrate.ts

```


5. **Spin up local engine:**
```bash
bun run src/index.ts

```



### Operational Deployment Pipeline

The platform contains a dedicated `nixpacks.toml` file, making it compatible out-of-the-box with immediate deployment layers like **Railway**, **Fly.io**, or custom setups using **Dokploy** on independent virtual private servers (Hetzner/AWS). The setup will auto-detect dependencies, run build optimizations, and establish high-throughput server boundaries cleanly.
"""



```

You can download this generated `.md` file, commit it right to the root of your `haizra-backend` repository, and push it live to instantly make your GitHub look highly professional!

```
