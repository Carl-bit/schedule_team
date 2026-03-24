const nodemailer = require('nodemailer');

// Configuración SMTP — usa variables de entorno
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

// Plantilla base HTML (estilo dashboard)
const buildHTML = (titulo, nombre, contenido, boton = null) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#0f172a;color:#333;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.2);max-width:600px;width:100%;">
    <tr><td align="center" style="background-color:#1e1b4b;padding:30px 20px;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">${titulo}</h1>
    </td></tr>
    <tr><td style="padding:40px 30px;">
        <p style="margin:0 0 20px 0;font-size:16px;line-height:1.5;color:#1e293b;">
            Hola <strong>${nombre}</strong>,
        </p>
        ${contenido}
        ${boton ? `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:25px;">
            <tr><td align="center">
                <a href="${boton.url}" style="display:inline-block;background-color:${boton.color || '#6366f1'};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;font-size:16px;">${boton.text}</a>
            </td></tr>
        </table>` : ''}
    </td></tr>
    <tr><td style="background-color:#f1f5f9;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 10px 0;font-size:13px;color:#64748b;">Este es un correo generado automáticamente. Por favor no respondas a este mensaje.</p>
        <p style="margin:0;font-size:13px;color:#64748b;">&copy; 2026 Schedule Test — Panel del Líder. Todos los derechos reservados.</p>
    </td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="40"></td></tr></table>
</td></tr></table>
</body></html>`;

// Bloque de detalle estilizado
const buildDetalle = (items) => {
    let rows = items.map(item => `
        <tr><td style="padding:0 20px 15px 20px;">
            <p style="margin:0 0 8px 0;font-size:14px;color:#64748b;">${item.label}:</p>
            <p style="margin:0;font-size:${item.bold ? '16px;font-weight:bold' : '14px'};color:#1e293b;">${item.value}</p>
        </td></tr>`).join('');
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border-left:4px solid #6366f1;border-radius:4px;margin-bottom:25px;">${rows}</table>`;
};

// === FUNCIONES DE ENVÍO ===

// 1. Cambio de dato de cuenta (correo, puesto, etc.)
const sendEmailCambio = async (destinatario, nombre, datoActualizado, fechaHora) => {
    const contenido = `
        <p style="margin:0 0 20px 0;font-size:16px;line-height:1.5;color:#475569;">
            Te informamos que se ha realizado un cambio en la configuración de tu cuenta. Revisa los detalles:
        </p>
        ${buildDetalle([
            { label: 'Dato actualizado', value: datoActualizado, bold: true },
            { label: 'Fecha y hora del cambio', value: fechaHora }
        ])}
        <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:#475569;">
            <strong>¿Fuiste tú?</strong> Si este cambio fue realizado por tu líder de equipo, no necesitas hacer nada. Si no reconoces este cambio, contacta a tu administrador.
        </p>`;

    const html = buildHTML('Actualización de Cuenta', nombre, contenido);
    return sendRaw(destinatario, `Actualización de Cuenta — ${datoActualizado}`, html);
};

// 2. Enviar informe por correo
const sendEmailInforme = async (destinatarios, nombre, asunto, descripcion, pdfBuffer = null) => {
    const contenido = `
        <p style="margin:0 0 20px 0;font-size:16px;line-height:1.5;color:#475569;">
            Se ha generado un informe desde el Panel del Líder. A continuación los detalles:
        </p>
        ${buildDetalle([
            { label: 'Informe', value: asunto, bold: true },
            { label: 'Descripción', value: descripcion },
            { label: 'Fecha de generación', value: new Date().toLocaleString('es-CL') }
        ])}
        <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:#475569;">
            ${pdfBuffer ? 'El informe se encuentra adjunto como archivo PDF.' : 'Puedes revisar el informe accediendo al Panel del Líder.'}
        </p>`;

    const html = buildHTML('Informe Generado', nombre, contenido);

    const attachments = pdfBuffer ? [{
        filename: `${asunto.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
    }] : [];

    // Enviar a cada destinatario
    const results = [];
    const addresses = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
    for (const to of addresses) {
        results.push(await sendRaw(to, `Informe: ${asunto}`, html, attachments));
    }
    return results;
};

// Función base de envío
const sendRaw = async (to, subject, html, attachments = []) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Schedule Test" <noreply@schedule.test>',
            to,
            subject,
            html,
            attachments
        });
        console.log(`📧 Email enviado a ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.log(`⚠️ Email no enviado a ${to}: ${error.message}`);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendEmailCambio,
    sendEmailInforme,
    sendRaw
};
