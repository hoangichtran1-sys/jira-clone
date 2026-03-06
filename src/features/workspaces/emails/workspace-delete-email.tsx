import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface WorkspaceDeletedEmailProps {
  workspaceName: string;
  deletedBy: string;
  deletedAt: string;
}

export const WorkspaceDeletedEmail = ({
  workspaceName,
  deletedBy,
  deletedAt,
}: WorkspaceDeletedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Workspace &quot;{workspaceName}&quot; has been deleted</Preview>

      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Workspace Deleted</Heading>

          <Text style={text}>
            The workspace <strong>{workspaceName}</strong> has been permanently
            deleted.
          </Text>

          <Section>
            <Text style={text}>
              <strong>Deleted by:</strong> {deletedBy}
            </Text>

            <Text style={text}>
              <strong>Deleted at:</strong> {deletedAt}
            </Text>
          </Section>

          <Hr />

          <Text style={footer}>
            If you did not expect this action or believe this was a mistake,
            please contact your administrator.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

WorkspaceDeletedEmail.PreviewProps = {
  workspaceName: "Marketing Team",
  deletedBy: "John Doe",
  deletedAt: "June 3, 2026",
} as WorkspaceDeletedEmailProps;

export default WorkspaceDeletedEmail;

const main = {
  backgroundColor: "#f6f9fc",
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  padding: "40px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "20px",
};

const text = {
  fontSize: "16px",
  lineHeight: "24px",
};

const footer = {
  fontSize: "14px",
  color: "#666",
};