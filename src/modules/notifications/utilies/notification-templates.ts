export interface NotificationTemplate {
  arTitle: string;
  enTitle: string;
  arBody: string;
  enBody: string;
  type: string;
  clickAction: string;
}

export const NotificationTemplates: Record<string, NotificationTemplate> = {
  RECEIVED_OFFER: {
    arTitle: 'تم استلام عرض جديد',
    enTitle: 'New Offer Received',
    arBody: 'قام فني بتقديم عرض على طلبك. اضغط لعرض التفاصيل.',
    enBody: 'A technician has submitted an offer for your request. Tap to view details.',
    type: 'order',
    clickAction: 'GO_TO_ORDER',
  },

  ACCEPTED_OFFER: {
    arTitle: 'تم قبول عرضك',
    enTitle: 'Offer Accepted',
    arBody: 'تم قبول عرضك. يمكنك متابعة حالة الطلب من صفحة الطلبات.',
    enBody: 'Your offer has been accepted. You can track the request status from the orders page.',
    type: 'order',
    clickAction: 'GO_TO_ORDER',
  },

  REQUEST_COMPLETE_ORDER: {
    arTitle: 'تم إنجاز الطلب',
    enTitle: 'Request Completed',
    arBody: 'تم إنجاز طلبك. نأمل أن تكون التجربة عند حسن ظنك. يرجى تأكيد استلام الخدمة ولا تنسى تقييمها',
    enBody: 'Your request has been completed. We hope the experience met your expectations. Please confirm receipt of the service and rate it',
    type: 'order',
    clickAction: 'GO_TO_ORDER',
  },

  REQUEST_DELETED: {
    arTitle: 'تم حذف الطلب',
    enTitle: 'Request Deleted',
    arBody: 'تم حذف طلبك من النظام. إذا كان لديك أي استفسار، يرجى التواصل مع الدعم.',
    enBody: 'Your request has been deleted from the system. If you have any questions, please contact support.',
    type: 'order',
    clickAction: 'NONE',
  },

  REPORT_REPLIED: {
    arTitle: 'تم مراجعة البلاغ',
    enTitle: 'Report Reviewed',
    arBody: 'تم مراجعة البلاغ الخاص بك. يمكنك عرض التفاصيل الآن.',
    enBody: 'Your report has been reviewed. You can view the details now.',
    type: 'general',
    clickAction: 'NONE',
  },

  WARNING_USER: {
    arTitle: 'تنبيه هام',
    enTitle: 'Important Notice',
    arBody: 'لقد تم إصدار تنبيه بشأن حسابك بسبب مخالفة سياسات المنصة. يُرجى مراجعة التفاصيل واتخاذ الإجراءات اللازمة.',
    enBody: 'A notice has been issued regarding your account due to a policy violation. Please review the details and take the necessary actions.',
    type: 'general',
    clickAction: 'NONE',
  },

  BLOCKED_USER: {
    arTitle: 'تم حظر الحساب',
    enTitle: 'Account Blocked',
    arBody: 'تم حظر حسابك بسبب تكرار المخالفات أو انتهاك سياسات المنصة. يُرجى التواصل مع الدعم إذا كنت تعتقد أن هذا خطأ.',
    enBody: 'Your account has been blocked due to repeated violations or policy breaches. Please contact support if you believe this is a mistake.',
    type: 'general',
    clickAction: 'NONE',
  },

  APPROVED_USER: {
    arTitle: 'تمت الموافقة على الحساب',
    enTitle: 'Account Approved',
    arBody: 'تمت الموافقة على حسابك ويمكنك الآن استخدام جميع خدمات المنصة.',
    enBody: 'Your account has been approved and you can now use all platform services.',
    type: 'general',
    clickAction: 'NONE',
  },

  UNAPPROVED_USER: {
    arTitle: 'الحساب غير مفعل بعد',
    enTitle: 'Account Not Approved Yet',
    arBody: 'حسابك لم يتم الموافقة عليه بعد من قبل الإدارة، لا يمكنك استخدام بعض خدمات المنصة.',
    enBody: 'Your account has not been approved by the admin yet. You cannot use some platform services.',
    type: 'general',
    clickAction: 'NONE',
  },

  NEW_CHAT_MESSAGE: {
    arTitle: 'رسالة جديدة من {{senderName}}',
    enTitle: 'New message from {{senderName}}',
    arBody: '{{messageContent}}',
    enBody: '{{messageContent}}',
    type: 'chat',
    clickAction: 'GO_TO_CHAT',
  },

  REGION_FORBIDDEN: {
    arTitle: 'منطقة غير متاحة',
    enTitle: 'Region Not Available',
    arBody: 'عذراً، المنطقة التي اخترتها غير متاحة حالياً. يرجى تحديث بياناتك.',
    enBody: 'Sorry, the region you selected is currently unavailable. Please update your data.',
    type: 'forbidden',
    clickAction: 'GO_TO_UPDATE_DATA',
  }

};
