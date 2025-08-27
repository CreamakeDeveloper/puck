"use client";

import { Button, Puck, Render } from "@/core";
import headingAnalyzer from "@/plugin-heading-analyzer/src/HeadingAnalyzer";
import config from "../../config";
import { useDemoData } from "../../lib/use-demo-data";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { useRouter } from 'next/navigation';

export function Client({ path, isEdit }: { path: string; isEdit: boolean }) {
  const router = useRouter();
  const metadata = {
    example: "Hello, world",
  };

  const { data, resolvedData, key } = useDemoData({
    path,
    isEdit,
    metadata,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const params = new URL(window.location.href).searchParams;

  if (isEdit) {
    return (
      <div>
        <Puck
          config={config}
          data={data}
          onBack={() => {
            try {
              router.back();
            } catch (error) {
              console.error('Navigation error:', error);
              // Fallback olarak ana sayfaya git
              router.push('/');
            }
          }}
          backButtonText="Geri Dön"
          backButtonIcon={ArrowLeft}
          onPublish={async (data) => {
            localStorage.setItem(key, JSON.stringify(data));
          }}
          plugins={[headingAnalyzer]}
          headerPath={path}
          siteId="1"
          themeId="1"
          isAdmin={true}
          iframe={{
            enabled: params.get("disableIframe") === "true" ? false : true,
          }}
          overrides={{
            headerActions: ({ children }) => (
              <>
                <div>
                  <Button href={path} newTab variant="secondary" size="medium" icon={<Eye size="14px" />}> 
                    Ön İzleme
                  </Button>
                </div>

                {children}
              </>
            ),
          }}
          metadata={metadata}
        />
      </div>
    );
  }

  if (data.content) {
    return <Render config={config} data={resolvedData} metadata={metadata} />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>
        <h1>404</h1>
        <p>Page does not exist in session storage</p>
      </div>
    </div>
  );
}

export default Client;
