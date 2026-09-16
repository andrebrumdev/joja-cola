import { ColumnChart, ShareBar, ThresholdBars } from "../components/charts";
import { marketing } from "../data/mock";

const int = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const pct1 = (value: number) => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const toneLabel = { positive: "Positivo", neutral: "Neutro", negative: "Negativo" } as const;

export function Marketing() {
  const { mentions, sentiment, topics, seasonal, campaigns } = marketing;
  const week = mentions.reduce((a, m) => a + m.count, 0);
  const first = mentions[0].count;
  const last = mentions[mentions.length - 1].count;
  const growth = ((last - first) / first) * 100;
  const launch = seasonal.regions.filter((r) => r.index >= seasonal.threshold);
  const hold = seasonal.regions.filter((r) => r.index < seasonal.threshold);
  const campaignOrders = campaigns.reduce((a, c) => a + c.orders, 0);

  return (
    <>
      <p className="kicker">CRM · social listening</p>
      <div className="toolbar">
        <h1>Marketing</h1>
      </div>

      <div className="kpi">
        <div className="card">
          <span className="kicker">Menções em 7 dias</span>
          <b>
            {int(week)} <small>+{int(growth)}% na semana</small>
          </b>
        </div>
        <div className="card">
          <span className="kicker">Sentimento positivo</span>
          <b>{sentiment.positive}%</b>
        </div>
        <div className="card">
          <span className="kicker">Pedidos de campanha</span>
          <b>{int(campaignOrders)}</b>
        </div>
      </div>

      <section className="card panel decision" aria-labelledby="season-title">
        <div className="panel-head">
          <div>
            <p className="kicker">Edição sazonal</p>
            <h2 id="season-title">
              {seasonal.product}: lançar em {launch.length} de {seasonal.regions.length} regiões
            </h2>
            <p className="hint">{seasonal.signal}. Só entra onde o índice passa de {seasonal.threshold}.</p>
          </div>
        </div>
        <ThresholdBars
          title={`Interesse por ${seasonal.product} por região`}
          data={seasonal.regions.map((r) => ({ label: r.region, value: r.index }))}
          threshold={{ value: seasonal.threshold, label: `Corte ${seasonal.threshold}` }}
          max={100}
          format={int}
        />
        <dl className="decision-list">
          <div>
            <dt>Lançar</dt>
            <dd>{launch.map((r) => r.region).join(", ")}</dd>
          </div>
          <div>
            <dt>Segurar</dt>
            <dd>{hold.map((r) => r.region).join(", ")}</dd>
          </div>
        </dl>
      </section>

      <div className="panel-grid">
        <section className="card panel" aria-labelledby="mentions-title">
          <div className="panel-head">
            <div>
              <h2 id="mentions-title">Menções por dia</h2>
              <p className="hint">Redes sociais e avaliações · {mentions[0].day} a {mentions[mentions.length - 1].day}</p>
            </div>
          </div>
          <ColumnChart
            title="Menções por dia"
            columnHead="Dia"
            data={mentions.map((m) => ({ label: m.day, value: m.count }))}
            format={int}
          />
        </section>

        <section className="card panel" aria-labelledby="sentiment-title">
          <div className="panel-head">
            <h2 id="sentiment-title">O que dizem</h2>
          </div>
          <ShareBar
            title="Sentimento das menções"
            segments={[
              { label: "Positivo", value: sentiment.positive, tone: "positive" },
              { label: "Neutro", value: sentiment.neutral, tone: "neutral" },
              { label: "Negativo", value: sentiment.negative, tone: "negative" },
            ]}
          />
          <ul className="topic-list">
            {topics.map((t) => (
              <li key={t.topic}>
                <span>{t.topic}</span>
                <span className={`topic-tone tone-${t.tone}`}>{toneLabel[t.tone]}</span>
                <span className="num">{int(t.count)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="card route-table-card">
        <table className="table data-table">
          <caption className="visually-hidden">Campanhas</caption>
          <thead>
            <tr>
              <th scope="col">Campanha</th>
              <th scope="col">Público</th>
              <th scope="col" className="num">Alcance</th>
              <th scope="col" className="num">CTR</th>
              <th scope="col" className="num">Pedidos</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.name}>
                <td className="route-id">
                  <strong>{c.name}</strong>
                </td>
                <td data-label="Público">{c.audience}</td>
                <td data-label="Alcance" className="num">{int(c.reach)}</td>
                <td data-label="CTR" className="num">{pct1(c.ctr)}</td>
                <td data-label="Pedidos" className="num">{int(c.orders)}</td>
                <td className="route-status">
                  <span className={c.status === "Ativa" ? "badge badge-ok" : "badge"}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
