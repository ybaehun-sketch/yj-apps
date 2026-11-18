import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

interface PrivacyPolicyContentProps {
  serviceName?: string;
  includeAiNotice?: boolean;
  headingLevel?: "h2" | "h3";
}

export function PrivacyPolicyContent({
  serviceName,
  includeAiNotice = false,
  headingLevel = "h2",
}: PrivacyPolicyContentProps) {
  const { lang } = useLanguage();
  const p = translations[lang].privacy;
  const s = p.sections;
  const resolvedServiceName = serviceName ?? p.generalServiceName;
  const Heading = headingLevel;
  const headingClass =
    headingLevel === "h3"
      ? "mb-2 mt-6 text-base font-semibold text-foreground"
      : "";

  return (
    <>
      <p>
        {p.introPrefix}
        {resolvedServiceName}
        {p.introSuffix}
      </p>

      <section>
        <Heading className={headingClass}>{s.s1Title}</Heading>
        <ul>
          <li>
            <strong>{s.s1AccountLabel}</strong>
            {s.s1AccountBody}
          </li>
          {includeAiNotice && (
            <li>
              <strong>{s.s1TokbiseoLabel}</strong>
              {s.s1TokbiseoBody}
            </li>
          )}
          <li>
            <strong>{s.s1PaymentLabel}</strong>
            {s.s1PaymentBody}
          </li>
          <li>
            <strong>{s.s1ContactLabel}</strong>
            {s.s1ContactBody}
          </li>
        </ul>
      </section>

      <section>
        <Heading className={headingClass}>{s.s2Title}</Heading>
        <ul>
          <li>{s.s2Items[0]}</li>
          {includeAiNotice && <li>{s.s2AiItem}</li>}
          <li>{s.s2Items[1]}</li>
          <li>{s.s2Items[2]}</li>
        </ul>
      </section>

      <section>
        <Heading className={headingClass}>{s.s3Title}</Heading>
        <p>{s.s3Body}</p>
        <ul>
          {s.s3Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <Heading className={headingClass}>{s.s4Title}</Heading>
        <ul>
          <li>
            <strong>{s.s4ProcedureLabel}</strong>
            {s.s4ProcedureBody}
          </li>
          <li>
            <strong>{s.s4MethodLabel}</strong>
            {s.s4MethodBody}
          </li>
        </ul>
      </section>

      <section>
        <Heading className={headingClass}>{s.s5Title}</Heading>
        <p>{s.s5Body}</p>
        <ul>
          <li>
            <strong>{s.s5CloudLabel}</strong>
            {s.s5CloudBody}
          </li>
          {includeAiNotice && (
            <li>
              <strong>{s.s5AiLabel}</strong>
              {s.s5AiBody}
            </li>
          )}
          <li>
            <strong>{s.s5MailLabel}</strong>
            {s.s5MailBody}
          </li>
        </ul>
      </section>

      <section>
        <Heading className={headingClass}>{s.s6Title}</Heading>
        <p>{s.s6Body}</p>
        <ul>
          <li>
            <strong>{s.s6DeleteLabel}</strong>
            {s.s6DeleteBeforeEmail}
            <strong>contact@yjstudio.app</strong>
            {s.s6DeleteAfterEmail}
          </li>
          <li>
            <strong>{s.s6ChildLabel}</strong>
            {s.s6ChildBody}
          </li>
        </ul>
      </section>

      <section>
        <Heading className={headingClass}>{s.s7Title}</Heading>
        <p>{s.s7Body}</p>
      </section>

      <section>
        <Heading className={headingClass}>{s.s8Title}</Heading>
        <ul>
          {s.s8Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <Heading className={headingClass}>{s.s9Title}</Heading>
        <p>
          {s.s9Officer}
          <br />
          {s.s9Company}
          <br />
          {s.s9Email}
        </p>
      </section>

      <section>
        <Heading className={headingClass}>{s.s10Title}</Heading>
        <p>{s.s10Body}</p>
        <ul>
          {s.s10Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <Heading className={headingClass}>{s.s11Title}</Heading>
        <p>{s.s11Body}</p>
      </section>
    </>
  );
}
