# API Contracts

## GraphQL Schema (apps/gateway)

graphql
type Strategy {
id: ID!
name: String!
version: String!
status: String!
yaml: String!
createdAt: String!
}

type Deployment {
id: ID!
strategyId: ID!
stage: String!
caps: JSON
createdAt: String!
}

type Position {
symbol: String!
exch: String!
side: String!
size: Float!
entryPrice: Float!
pnl: Float!
}

type PnlPoint { t: Float!, pnl: Float! }

type Query {
strategies: [Strategy!]!
strategy(id: ID!): Strategy
positions: [Position!]!
pnl(session: ID): [PnlPoint!]!
}

type Mutation {
saveStrategy(input: StrategyInput!): Strategy!
deployStrategy(id: ID!, stage: Stage!): Deployment!
haltTrading(id: ID!): Boolean!
}

type Subscription {
telemetry: TelemetryEvent!
fills(strategyId: ID): Fill!
riskStatus: RiskSignal!
}

REST Endpoints

    POST /api/strategies — validate & save strategy YAML/JSON

    POST /api/deployments/:id/promote — promote strategy from shadow to live

    POST /api/control/halt — global or per-strategy halt

    GET /api/reports/:runId — fetch backtest or walk-forward reports

WebSocket Channels

    /ws/telemetry — PnL, risk lights, system metrics

    /ws/fills — live trade stream

    /ws/logs — structured logs for agents

All messages follow the schema: { event, timestamp, payload }
