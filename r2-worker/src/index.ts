export interface Env {
  COVERS_BUCKET: R2Bucket;
  AUTH_SECRET: string;
  PUBLIC_URL_BASE: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // ปรับเป็นโดเมนของแอปจริงเมื่อ deploy production
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // จัดการ Preflight Request (CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ตรวจสอบสิทธิ์ สำหรับ POST และ DELETE
    if (['POST', 'DELETE'].includes(request.method)) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || authHeader !== `Bearer ${env.AUTH_SECRET}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Endpoint: อัปโหลดรูปภาพ
    if (request.method === 'POST' && url.pathname === '/upload') {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const patchId = formData.get('patchId') as string | null;

        if (!file) {
          return new Response(JSON.stringify({ error: 'Missing file' }), { status: 400, headers: corsHeaders });
        }

        // จัดการชื่อไฟล์ โดยใช้ patchId หรือ random UUID
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = patchId ? `${patchId}.${extension}` : `${crypto.randomUUID()}.${extension}`;
        const objectName = `covers/${filename}`;

        // บันทึกไฟล์ลง R2 Bucket
        await env.COVERS_BUCKET.put(objectName, file.stream(), {
          httpMetadata: { contentType: file.type },
        });

        const publicUrl = `${env.PUBLIC_URL_BASE}/${objectName}`;

        return new Response(JSON.stringify({ 
          success: true, 
          url: publicUrl,
          objectName: objectName
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500, headers: corsHeaders });
      }
    }

    // Endpoint: ลบรูปภาพ
    if (request.method === 'DELETE' && url.pathname === '/delete') {
      try {
        const body = (await request.json()) as { url?: string; objectName?: string };
        let objectName = body.objectName;
        
        // หากส่ง url มา ให้สกัด objectName ออกมา (ตัด PUBLIC_URL_BASE ออก)
        if (body.url && env.PUBLIC_URL_BASE) {
          const parsedUrl = new URL(body.url);
          // เอา path ที่ไม่มี / นำหน้ามาใช้เป็น objectName (หรือปรับตาม logic ของ PUBLIC_URL_BASE)
          // เช่น https://pub-xxx.r2.dev/covers/xxx.jpg -> objectName = covers/xxx.jpg
          if (body.url.startsWith(env.PUBLIC_URL_BASE)) {
             objectName = body.url.substring(env.PUBLIC_URL_BASE.length + 1);
          } else {
             // Fallback
             objectName = parsedUrl.pathname.substring(1);
          }
        }

        if (!objectName) {
           return new Response(JSON.stringify({ error: 'Missing objectName or url' }), { status: 400, headers: corsHeaders });
        }

        await env.COVERS_BUCKET.delete(objectName);
        
        return new Response(JSON.stringify({ success: true }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Delete failed' }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};
