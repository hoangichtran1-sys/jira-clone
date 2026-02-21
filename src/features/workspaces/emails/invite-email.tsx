import {
    Html,
    Body,
    Container,
    Text,
    Heading,
    Link,
    Section,
} from "@react-email/components";

interface InviteEmailProps {
    title: string;
    link: string;
    sentTime: string;
}

export const InviteEmail = ({ title, link, sentTime }: InviteEmailProps) => {
    return (
        <Html>
            <Body style={{ backgroundColor: "#f4f4f7", padding: "20px" }}>
                <Container
                    style={{
                        backgroundColor: "#fff",
                        padding: "30px",
                        borderRadius: "8px",
                    }}
                >
                    <Heading>{title}</Heading>

                    <Text>Xin chào bạn,</Text>

                    <Text>
                        Mời bạn tham gia vào workspace qua đường link dưới đây:
                    </Text>

                    <Section
                        style={{
                            backgroundColor: "#f4f4f7",
                            padding: "20px",
                            borderRadius: "6px",
                        }}
                    >
                        <Text>
                            <Link href={link}>{link}</Link>
                        </Text>
                    </Section>

                    <Text>
                        Thư được gửi lúc <strong>{sentTime}</strong>.
                    </Text>

                    <Text>Trân trọng.</Text>
                </Container>
            </Body>
        </Html>
    );
}
