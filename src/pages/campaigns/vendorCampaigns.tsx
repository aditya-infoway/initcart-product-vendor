import { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";
import apiClient from "../../api/apiClient";
import { useAuthStore } from "../../store/authStore";

interface Category {
  id: number;
  name: string;
}

interface ProductStock {
  id: number;
  selling_price: number;
  mrp: number;
  color?: string;
  size?: string;
  stock_quantity: number;
}

interface Product {
  id: number;
  product_name: string;
  category: number;
  category_name?: string;
  status: string;
  original_price: number;
  mrp: number;
  stock_quantity: number;
  stocks: ProductStock[];
}

interface Campaign {
  id: number;
  campaign_name: string;
  campaign_type: "Flash" | "Deal of the Day" | "Featured";
  categories: number[];
  categories_details?: {
    id: number;
    name: string;
  }[];
  start_datetime: string;
  end_datetime: string;
  description: string;
  status: "Active" | "Inactive" | "Draft" | "Expired";
  max_products_per_vendor: number;
  minimum_discount: number;
  minimum_product_limit: number;
  deal_of_day_placement?: string;
  is_active: boolean;
  duration: string;
  participation_count: number;
  created_at: string;
  updated_at: string;
  category?: number;
  category_details?: {
    id: number;
    name: string;
  };
  start_date?: string;
  end_date?: string;
}

interface CampaignProduct {
  id: number;
  product: number;
  product_details?: any;
  special_price?: number;
  discount_percentage?: number;
  status: "Pending" | "Approved" | "Rejected";
  final_price?: number;
  original_price?: number;  // Add this line
  deal_of_day_placement?: string;
  discount_updated?: boolean;
  vendor_updated_at?: string;
  is_banner_configured?: boolean;
}

interface CampaignParticipation {
  id: number;
  campaign: number;
  campaign_details?: Campaign;
  vendor: number;
  status: "Pending" | "Approved" | "Rejected";
  applied_at: string;
  approved_at?: string;
  selected_products?: CampaignProduct[];
  available_products?: Product[];
  remaining_slots?: number;
  product_count?: number;
}

interface ProductWithDiscount {
  product_id: number;
  product_name: string;
  original_price: number;
  discount_type: 'flat' | 'percentage' | null;
  discount_value: number | null;
  special_price: number | null;
  final_price: number;
  stock_variant?: number;
  deal_of_day_placement?: string;
}

const VendorCampaigns = () => {
  const { vendor } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [myParticipations, setMyParticipations] = useState<CampaignParticipation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingParticipations, setLoadingParticipations] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [productsModalOpen, setProductsModalOpen] = useState<boolean>(false);
  const [participationsModalOpen, setParticipationsModalOpen] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedParticipation, setSelectedParticipation] = useState<CampaignParticipation | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductWithDiscount[]>([]);
  const [discountModalOpen, setDiscountModalOpen] = useState<boolean>(false);
  const [placementModalOpen, setPlacementModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [updatePlacementModalOpen, setUpdatePlacementModalOpen] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productForPlacement, setProductForPlacement] = useState<ProductWithDiscount | null>(null);
  const [productToUpdate, setProductToUpdate] = useState<CampaignProduct | null>(null);
  const [productToUpdatePlacement, setProductToUpdatePlacement] = useState<CampaignProduct | null>(null);
  const [refresh, setRefresh] = useState<number>(0);
  const [addingProducts, setAddingProducts] = useState<boolean>(false);
  
  const isCampaignExpired = useCallback((campaign: Campaign | undefined) => {
    if (!campaign) return true;
    const now = new Date();
    const endDate = new Date(campaign.end_datetime || campaign.end_date || '');
    const isDateExpired = endDate < now;
    return isDateExpired || campaign.status === 'Expired';
  }, []);

  const calculateRemainingSlots = (participation: CampaignParticipation) => {
    if (!participation?.campaign_details?.max_products_per_vendor) return 0;
    if (isCampaignExpired(participation.campaign_details)) {
      return 0;
    }
    const maxSlots = participation.campaign_details.max_products_per_vendor;
    const usedSlots = participation.selected_products?.length || 0;
    return Math.max(0, maxSlots - usedSlots);
  };

  const getCurrentSelectedCount = useCallback(() => {
    if (!selectedParticipation) return 0;
    const existingCount = selectedParticipation.selected_products?.length || 0;
    const newCount = selectedProducts.length;
    return existingCount + newCount;
  }, [selectedParticipation, selectedProducts]);

  // Update Product Discount Form
  const updateProductFormik = useFormik({
    initialValues: {
      discount_type: 'percentage' as 'flat' | 'percentage' | null,
      discount_value: 0,
      special_price: '',
    },
    validationSchema: Yup.object({
      discount_type: Yup.string().oneOf(['flat', 'percentage']).required('Discount type is required'),
      discount_value: Yup.number()
        .when('discount_type', {
          is: 'percentage',
          then: (schema) => schema
            .min(1, 'Discount value must be at least 1%')
            .max(100, 'Percentage discount cannot exceed 100%')
            .required('Discount percentage is required'),
          otherwise: (schema) => schema.nullable()
        }),
      special_price: Yup.number()
        .when('discount_type', {
          is: 'flat',
          then: (schema) => schema.min(1, 'Special price must be at least ₹1').required('Special price is required'),
          otherwise: (schema) => schema.nullable()
        }),
    }),
    onSubmit: async (values) => {
      if (!productToUpdate) return;
      try {
        const response = await apiClient.post(
          `ecommerce/vendor/update-campaign-product/${productToUpdate.id}/`,
          values
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: response.data.message || "Product updated successfully. Waiting for admin approval.",
          timer: 2000,
        });
        setUpdateModalOpen(false);
        setProductToUpdate(null);
        updateProductFormik.resetForm();
        setTimeout(() => {
          fetchMyParticipations();
        }, 500);
      } catch (error: any) {
        console.error("Error updating product:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || "Failed to update product",
        });
      }
    }
  });

  // Update Product Placement Form
  const updatePlacementFormik = useFormik({
    initialValues: {
      deal_of_day_placement: 'product_list'
    },
    onSubmit: async (values) => {
      if (!productToUpdatePlacement) return;
      try {
        const response = await apiClient.post(
          `ecommerce/vendor/update-deal-placement/${productToUpdatePlacement.id}/`,
          { deal_of_day_placement: values.deal_of_day_placement }
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: response.data.message || "Product placement updated successfully",
          timer: 2000,
        });
        setUpdatePlacementModalOpen(false);
        setProductToUpdatePlacement(null);
        setTimeout(() => {
          fetchMyParticipations();
        }, 500);
      } catch (error: any) {
        console.error("Error updating placement:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || "Failed to update placement",
        });
      }
    }
  });

  const handleOpenUpdateModal = (product: CampaignProduct) => {
    setProductToUpdate(product);
    updateProductFormik.setValues({
      discount_type: product.discount_percentage ? 'percentage' : (product.special_price ? 'flat' : null),
      discount_value: product.discount_percentage || 0,
      special_price: product.special_price?.toString() || '',
    });
    setUpdateModalOpen(true);
  };

  const handleOpenUpdatePlacementModal = (product: CampaignProduct) => {
    setProductToUpdatePlacement(product);
    updatePlacementFormik.setValues({
      deal_of_day_placement: product.deal_of_day_placement || 'product_list'
    });
    setUpdatePlacementModalOpen(true);
  };

  // ============ FIXED: Deal of the Day Placement ============
  const placementFormik = useFormik({
    initialValues: {
      deal_of_day_placement: 'product_list'
    },
    onSubmit: (values) => {
      if (!productForPlacement) return;

      // Update productForPlacement with selected placement
      const updatedProduct = {
        ...productForPlacement,
        deal_of_day_placement: values.deal_of_day_placement
      };
      
      setProductForPlacement(updatedProduct);
      setPlacementModalOpen(false);
      
      // Pass the placement to discount modal
      if (currentProduct) {
        discountFormik.setFieldValue('deal_of_day_placement', values.deal_of_day_placement);
        setDiscountModalOpen(true);
      }
    }
  });

  const handlePlacementSelect = (placement: string) => {
    placementFormik.setFieldValue('deal_of_day_placement', placement);
    if (productForPlacement) {
      setProductForPlacement({
        ...productForPlacement,
        deal_of_day_placement: placement
      });
    }
  };
  // ==========================================================

  const discountFormik = useFormik({
    initialValues: {
      discount_type: 'percentage' as 'flat' | 'percentage' | null,
      discount_value: 10,
      special_price: '',
      stock_variant: 0,
      deal_of_day_placement: 'product_list'
    },
    validationSchema: Yup.object({
      discount_type: Yup.string().oneOf(['flat', 'percentage']),
      discount_value: Yup.number()
        .when('discount_type', {
          is: (val: string) => val === 'flat' || val === 'percentage',
          then: (schema) => schema
            .min(1, 'Discount value must be at least 1')
            .max(100, 'Percentage discount cannot exceed 100%')
            .required('Discount value is required'),
          otherwise: (schema) => schema.nullable()
        }),
      special_price: Yup.number()
        .when('discount_type', {
          is: 'flat',
          then: (schema) => schema.min(1, 'Special price must be at least 1').required('Special price is required'),
          otherwise: (schema) => schema.nullable()
        }),
    }),
    onSubmit: (values) => {
      if (!currentProduct) return;

      const originalPrice = currentProduct.original_price;
      let finalPrice = originalPrice;
      let discountValue = 0;

      if (values.discount_type === 'percentage' && values.discount_value) {
        discountValue = values.discount_value;
        const discountAmount = (originalPrice * discountValue) / 100;
        finalPrice = originalPrice - discountAmount;
      } else if (values.discount_type === 'flat' && values.special_price) {
        const specialPrice = parseFloat(values.special_price);
        finalPrice = specialPrice;
        discountValue = originalPrice - specialPrice;
      }

      if (selectedParticipation?.campaign_details?.campaign_type !== "Featured") {
        const campaign = selectedParticipation?.campaign_details;
        if (campaign?.minimum_discount && campaign.minimum_discount > 0) {
          if (values.discount_type === 'percentage') {
            if (!values.discount_value || values.discount_value < campaign.minimum_discount) {
              Swal.fire({
                icon: "error",
                title: "Discount Requirement",
                text: `Minimum ${campaign.minimum_discount}% discount required for this campaign`,
              });
              return;
            }
          } else if (values.discount_type === 'flat') {
            const discountPercentage = ((originalPrice - finalPrice) / originalPrice) * 100;
            if (discountPercentage < campaign.minimum_discount) {
              Swal.fire({
                icon: "error",
                title: "Discount Requirement",
                text: `Minimum ${campaign.minimum_discount}% discount required. Current: ${discountPercentage.toFixed(1)}%`,
              });
              return;
            }
          }
        }
      }

      const existingIndex = selectedProducts.findIndex(p => p.product_id === currentProduct.id);

      // ============ FIXED: Get placement value from productForPlacement ============
      let placementValue = values.deal_of_day_placement;
      if (productForPlacement && productForPlacement.deal_of_day_placement) {
        placementValue = productForPlacement.deal_of_day_placement;
      }
      // ========================================================================

      const productWithDiscount: ProductWithDiscount = {
        product_id: currentProduct.id,
        product_name: currentProduct.product_name,
        original_price: originalPrice,
        discount_type: values.discount_type,
        discount_value: values.discount_type ?
          (values.discount_type === 'percentage' ? values.discount_value : discountValue) : null,
        special_price: values.discount_type === 'flat' ? parseFloat(values.special_price) : null,
        final_price: finalPrice,
        stock_variant: values.stock_variant,
        deal_of_day_placement: placementValue
      };

      if (existingIndex >= 0) {
        const updated = [...selectedProducts];
        updated[existingIndex] = productWithDiscount;
        setSelectedProducts(updated);
      } else {
        setSelectedProducts([...selectedProducts, productWithDiscount]);
      }

      const toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      toast.fire({
        icon: 'success',
        title: `${currentProduct.product_name} added with discount`
      });

      setDiscountModalOpen(false);
      setCurrentProduct(null);
      discountFormik.resetForm();
    }
  });

  const fetchAvailableCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('ecommerce/vendor/campaigns/');
      if (response.data) {
        const now = new Date();
        const transformedCampaigns = response.data
          .map((campaign: any) => {
            let categoriesArray: number[] = [];
            if (Array.isArray(campaign.categories) && campaign.categories.length > 0) {
              categoriesArray = campaign.categories;
            } else if (campaign.category) {
              categoriesArray = [campaign.category];
            }
            const startDatetime = campaign.start_datetime || campaign.start_date;
            const endDatetime = campaign.end_datetime || campaign.end_date;
            const endDate = new Date(endDatetime);
            const isDateExpired = endDate < now;
            const isExpired = isDateExpired || campaign.status === 'Expired';
            return {
              ...campaign,
              categories: categoriesArray,
              start_datetime: startDatetime,
              end_datetime: endDatetime,
              start_date: startDatetime,
              end_date: endDatetime,
              category: campaign.categories?.[0] || campaign.category,
              is_expired: isExpired
            };
          })
          .filter((campaign: any) => !campaign.is_expired);
        setCampaigns(transformedCampaigns);
      }
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyParticipations = useCallback(async () => {
    try {
      setLoadingParticipations(true);
      const response = await apiClient.get('ecommerce/vendor/campaign-participations/');
      if (response.data) {
        const now = new Date();
        const transformedParticipations = response.data
          .map((participation: any) => {
            const maxSlots = participation.campaign_details?.max_products_per_vendor || 0;
            const usedSlots = participation.selected_products?.length || 0;
            const remainingSlots = Math.max(0, maxSlots - usedSlots);
            const endDate = new Date(
              participation.campaign_details?.end_datetime ||
              participation.campaign_details?.end_date || ''
            );
            const isDateExpired = endDate < now;
            const isCampaignExpired = isDateExpired ||
              participation.campaign_details?.status === 'Expired';
            return {
              ...participation,
              campaign_details: participation.campaign_details ? {
                ...participation.campaign_details,
                categories: participation.campaign_details.categories || [participation.campaign_details.category || 0],
                start_datetime: participation.campaign_details.start_datetime || participation.campaign_details.start_date,
                end_datetime: participation.campaign_details.end_datetime || participation.campaign_details.end_date,
                is_expired: isCampaignExpired
              } : null,
              remaining_slots: remainingSlots,
              product_count: usedSlots,
              is_campaign_expired: isCampaignExpired
            };
          })
          .filter((participation: any) => !participation.is_campaign_expired);
        setMyParticipations(transformedParticipations);
      }
    } catch (error: any) {
      console.error("Error fetching participations:", error);
    } finally {
      setLoadingParticipations(false);
    }
  }, []);

  const fetchVendorProducts = async (campaignCategories: number[]) => {
    try {
      const response = await apiClient.get('ecommerce/vendor/products/');
      const allProducts = response.data || [];
      const filteredProducts = allProducts.filter((product: any) =>
        campaignCategories.includes(product.category) && product.status === "approved"
      );
      const productsWithPrices = await Promise.all(
        filteredProducts.map(async (product: any) => {
          try {
            const detailResponse = await apiClient.get(`ecommerce/vendor/product-details/${product.id}/`);
            return detailResponse.data;
          } catch {
            return product;
          }
        })
      );
      setAvailableProducts(productsWithPrices);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchAvailableCampaigns();
    fetchMyParticipations();
  }, [fetchAvailableCampaigns, fetchMyParticipations, refresh]);

  const hasParticipated = (campaignId: number): boolean => {
    return myParticipations.some(participation => participation.campaign === campaignId);
  };

  const getParticipationStatus = (campaignId: number): string | null => {
    const participation = myParticipations.find(p => p.campaign === campaignId);
    return participation ? participation.status : null;
  };

  const handleParticipate = async (campaign: Campaign) => {
    const endDate = new Date(campaign.end_datetime || campaign.end_date || '');
    const now = new Date();
    if (endDate < now) {
      Swal.fire({
        icon: "error",
        title: "Campaign Expired",
        text: "This campaign has already ended. You cannot join expired campaigns.",
      });
      return;
    }
    try {
      const checkResponse = await apiClient.get(`ecommerce/vendor/daily-participation-check/${campaign.id}/`);
      if (!checkResponse.data.can_participate_today) {
        Swal.fire({
          icon: "error",
          title: "Cannot Participate",
          text: checkResponse.data.message,
        });
        return;
      }
    } catch (error) {
      console.error("Error checking daily participation:", error);
    }
    const result = await Swal.fire({
      title: "Join Campaign",
      text: `Are you sure you want to join "${campaign.campaign_name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Join",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await apiClient.post(`ecommerce/vendor/participate/${campaign.id}/`);
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: response.data.message || "You have successfully applied for this campaign",
        timer: 2000,
      });
      setRefresh(prev => prev + 1);
    } catch (error: any) {
      console.error("Error participating:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || error.response?.data?.detail || "Failed to join campaign",
      });
    }
  };

  const handleViewProducts = async (participation: CampaignParticipation) => {
    if (isCampaignExpired(participation.campaign_details)) {
      Swal.fire({
        icon: "error",
        title: "Campaign Expired",
        text: "This campaign has ended. You cannot add products to an expired campaign.",
      });
      return;
    }
    setSelectedParticipation(participation);
    setSelectedProducts([]);
    const campaignCategories = participation.campaign_details?.categories ||
      [participation.campaign_details?.category || 0];
    if (campaignCategories && campaignCategories.length > 0) {
      await fetchVendorProducts(campaignCategories);
    }
    setProductsModalOpen(true);
  };

  // ============ FIXED: Product Selection with Placement ============
  const handleProductSelect = (product: Product) => {
    if (!selectedParticipation) return;

    if (isCampaignExpired(selectedParticipation.campaign_details)) {
      Swal.fire({
        icon: "error",
        title: "Campaign Expired",
        text: "This campaign has ended. You cannot add products.",
      });
      return;
    }

    const maxSlots = selectedParticipation.campaign_details?.max_products_per_vendor || 0;
    const currentTotalSelected = getCurrentSelectedCount();

    if (currentTotalSelected + 1 > maxSlots) {
      const remainingSlots = Math.max(0, maxSlots - currentTotalSelected);
      Swal.fire({
        icon: "warning",
        title: "Limit Reached",
        text: `You can only add ${maxSlots} products. ${remainingSlots} slots remaining.`,
        timer: 3000,
      });
      return;
    }

    if (selectedProducts.some(p => p.product_id === product.id)) {
      Swal.fire({
        icon: "info",
        title: "Already Selected",
        text: "This product is already in your selection list",
        timer: 2000,
      });
      return;
    }

    const isAlreadyInCampaign = selectedParticipation.selected_products?.some(
      (cp: CampaignProduct) => cp.product === product.id
    );

    if (isAlreadyInCampaign) {
      Swal.fire({
        icon: "warning",
        title: "Already in Campaign",
        html: `
          <div class="text-left">
            <p><strong>${product.product_name}</strong> is already added to this campaign.</p>
            <p class="text-sm text-gray-600 mt-1">You cannot add the same product twice.</p>
          </div>
        `,
        confirmButtonText: "OK"
      });
      return;
    }

    setCurrentProduct(product);

    if (selectedParticipation.campaign_details?.campaign_type === "Deal of the Day") {
      const defaultPlacement = selectedParticipation.campaign_details?.deal_of_day_placement || 'product_list';
      
      // Reset discount form placement
      discountFormik.setFieldValue('deal_of_day_placement', defaultPlacement);
      
      setPlacementModalOpen(true);
      setProductForPlacement({
        product_id: product.id,
        product_name: product.product_name,
        original_price: product.original_price,
        discount_type: null,
        discount_value: null,
        special_price: null,
        final_price: product.original_price,
        deal_of_day_placement: defaultPlacement
      });
    } else {
      setDiscountModalOpen(true);
    }
  };
  // ================================================================

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.product_id !== productId));
  };

  // ============ FIXED: Add Products to Campaign ============
  const handleAddProductsToCampaign = async () => {
    if (!selectedParticipation || selectedProducts.length === 0) {
      const toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      toast.fire({
        icon: "warning",
        title: "No products selected"
      });
      return;
    }

    if (isCampaignExpired(selectedParticipation.campaign_details)) {
      Swal.fire({
        icon: "error",
        title: "Campaign Expired",
        text: "This campaign has ended. You cannot add products.",
      });
      return;
    }

    setAddingProducts(true);

    const productsData = selectedProducts.map(product => {
      const data: any = {
        product_id: product.product_id,
        discount_type: product.discount_type
      };

      if (product.discount_type === 'percentage') {
        data.discount_value = product.discount_value;
        data.special_price = null;
      } else if (product.discount_type === 'flat') {
        data.discount_value = null;
        data.special_price = product.final_price;
      }

      // FIXED: Always send deal_of_day_placement if it exists
      if (product.deal_of_day_placement) {
        data.deal_of_day_placement = product.deal_of_day_placement;
      }

      return data;
    });

    try {
      const response = await apiClient.post(
        `ecommerce/vendor/add-products/${selectedParticipation.id}/`,
        { products: productsData }
      );

      if (response.data.total_added > 0) {
        Swal.fire({
          icon: "success",
          title: "Products Added!",
          html: `
            <div class="text-left">
              <p><strong>${response.data.total_added} products added successfully!</strong></p>
              ${response.data.already_added_count > 0 ? 
                `<p class="text-yellow-600 mt-2">${response.data.already_added_count} products were already added</p>` : 
                ''}
              ${response.data.validation_errors ? 
                `<p class="text-red-600 mt-2">${response.data.validation_errors.length} products had validation errors</p>` : 
                ''}
            </div>
          `,
          confirmButtonText: "OK"
        });
        setProductsModalOpen(false);
        setSelectedProducts([]);
        setTimeout(() => {
          setRefresh(prev => prev + 1);
        }, 500);
      } else {
        let errorMessage = "No products were added. ";
        if (response.data.already_added_products && response.data.already_added_products.length > 0) {
          errorMessage += `${response.data.already_added_count} products are already added to this campaign.`;
        } else if (response.data.validation_errors && response.data.validation_errors.length > 0) {
          errorMessage += `${response.data.validation_errors.length} products have validation errors.`;
        }
        Swal.fire({
          icon: "warning",
          title: "No Products Added",
          text: errorMessage,
          timer: 3000,
        });
      }
    } catch (error: any) {
      console.error("Add products error:", error.response?.data);
      if (error.response?.data?.already_added_products) {
        const alreadyAdded = error.response.data.already_added_products;
        if (alreadyAdded.length === selectedProducts.length) {
          Swal.fire({
            icon: "info",
            title: "Products Already Added",
            text: "All selected products are already in this campaign",
            timer: 3000,
          });
        } else {
          const productNames = alreadyAdded.map((p: any) => p.product_name).join(', ');
          Swal.fire({
            icon: "warning",
            title: "Some Products Already Added",
            html: `
              <div class="text-left">
                <p>The following products are already in this campaign:</p>
                <ul class="list-disc pl-5 mt-2">
                  ${alreadyAdded.map((p: any) => `<li>${p.product_name}</li>`).join('')}
                </ul>
              </div>
            `,
            confirmButtonText: "OK"
          });
        }
      } else if (error.response?.data?.validation_errors) {
        const validationErrors = error.response.data.validation_errors;
        Swal.fire({
          icon: "error",
          title: "Validation Errors",
          html: `
            <div class="text-left max-h-60 overflow-y-auto">
              <p>The following errors occurred:</p>
              <ul class="list-disc pl-5 mt-2">
                ${validationErrors.map((err: any) => 
                  `<li><strong>${err.product_name || 'Product'}:</strong> ${err.error}</li>`
                ).join('')}
              </ul>
            </div>
          `,
          confirmButtonText: "OK",
          width: 600
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || error.response?.data?.detail || "Failed to add products",
        });
      }
    } finally {
      setAddingProducts(false);
    }
  };
  // =========================================================

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      "Active": "bg-green-100 text-green-800 border border-green-200",
      "Inactive": "bg-gray-100 text-gray-800 border border-gray-200",
      "Draft": "bg-blue-100 text-blue-800 border border-blue-200",
      "Expired": "bg-red-100 text-red-800 border border-red-200"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.Inactive}`}>
        {status}
      </span>
    );
  };

  const getCampaignTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      "Flash": "bg-purple-100 text-purple-800 border border-purple-200",
      "Deal of the Day": "bg-orange-100 text-orange-800 border border-orange-200",
      "Featured": "bg-pink-100 text-pink-800 border border-pink-200"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[type] || "bg-gray-100 text-gray-800"}`}>
        {type}
      </span>
    );
  };

  const getPlacementLabel = (placement: string) => {
    switch (placement) {
      case 'main': return 'Main Image Section';
      case 'banner': return 'Hero Banner Image';
      case 'product_list': return 'Deal of the Day List';
      default: return placement;
    }
  };

  const getCategoriesDisplay = (campaign: Campaign) => {
    if (campaign.categories_details && campaign.categories_details.length > 0) {
      return campaign.categories_details.map(cat => cat.name).join(', ');
    } else if (campaign.categories && campaign.categories.length > 0) {
      return `Categories: ${campaign.categories.join(', ')}`;
    } else if (campaign.category_details) {
      return campaign.category_details.name;
    } else {
      return `Category #${campaign.category || 'N/A'}`;
    }
  };

  const canJoinCampaign = (campaign: Campaign) => {
    const now = new Date();
    const endDate = new Date(campaign.end_datetime || campaign.end_date || '');
    if (endDate < now) return false;
    if (campaign.status === 'Expired') return false;
    return campaign.is_active && campaign.status === "Active";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Campaigns</h1>
            <p className="text-gray-600 mt-1">
              Join campaigns and add your products with special discounts
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Participations Button */}
            <button
              onClick={() => setParticipationsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View My Participations
              {myParticipations.length > 0 && (
                <span className="ml-1 bg-white text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {myParticipations.length}
                </span>
              )}
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Vendor: <span className="font-semibold">{vendor?.business_name || "Your Store"}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Campaigns */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Available Campaigns</h2>
          <button
            onClick={() => setRefresh(prev => prev + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-lg">No active campaigns available at the moment</p>
            <p className="text-sm">Check back later for new campaigns</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const hasJoined = hasParticipated(campaign.id);
              const participation = myParticipations.find(p => p.campaign === campaign.id);
              const usedSlots = participation?.selected_products?.length || 0;
              const maxSlots = campaign.max_products_per_vendor;
              const remainingSlots = Math.max(0, maxSlots - usedSlots);
              const canJoin = canJoinCampaign(campaign);
              const now = new Date();
              const endDate = new Date(campaign.end_datetime || campaign.end_date || '');
              const isExpired = endDate < now || campaign.status === 'Expired';

              return (
                <div key={campaign.id} className={`border rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-white ${isExpired ? 'border-gray-300 opacity-80' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{campaign.campaign_name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(campaign.status)}
                        {getCampaignTypeBadge(campaign.campaign_type)}
                        {isExpired && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold">Categories:</span> {getCategoriesDisplay(campaign)}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold">Duration:</span> {formatDate(campaign.start_datetime || campaign.start_date || "")} - {formatDate(campaign.end_datetime || campaign.end_date || "")}
                      </span>
                      {isExpired && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">
                          (Ended)
                        </span>
                      )}
                    </div>

                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold">Requirements:</span>
                        {campaign.campaign_type !== "Featured" && (
                          <span className="ml-1">Min {campaign.minimum_discount}% discount,</span>
                        )}
                        <span className="ml-1">Min {campaign.minimum_product_limit} products</span>
                      </span>
                    </div>

                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold">Products:</span> {usedSlots}/{maxSlots} • {remainingSlots} slots left
                      </span>
                    </div>
                  </div>

                  {campaign.description && (
                    <div className="mb-5">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {campaign.description}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      {campaign.participation_count || 0} vendors joined
                    </div>

                    {hasJoined ? (
                      <div className="flex items-center gap-3">
                        {!isExpired && participation?.status === 'Pending' && (
                          <button
                            onClick={() => {
                              const participation = myParticipations.find(p => p.campaign === campaign.id);
                              if (participation) handleViewProducts(participation);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Products
                          </button>
                        )}
                        {isExpired && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                            Campaign Ended
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleParticipate(campaign)}
                        disabled={!canJoin}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${canJoin
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-sm'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {canJoin ? 'Join Now' : 'Not Active'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Participations Modal */}
      {participationsModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">My Campaign Participations</h2>
                  <p className="text-gray-600 mt-1">
                    You have joined {myParticipations.length} campaign{myParticipations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setParticipationsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {loadingParticipations ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your participations...</p>
                </div>
              ) : myParticipations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-lg">No campaign participations yet</p>
                  <p className="text-sm">Join a campaign to see your participations here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {myParticipations.map((participation) => (
                    <div key={participation.id} className="border rounded-xl p-5 hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">{participation.campaign_details?.campaign_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {participation.campaign_details && getCampaignTypeBadge(participation.campaign_details.campaign_type)}
                            {isCampaignExpired(participation.campaign_details) && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                Campaign Ended
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Applied: {formatDate(participation.applied_at)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-600">Campaign Type:</span>
                          <p className="font-medium">{participation.campaign_details?.campaign_type}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Products Added:</span>
                          <p className="font-medium">{participation.selected_products?.length || 0}/{participation.campaign_details?.max_products_per_vendor || 0}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Remaining Slots:</span>
                          <p className="font-medium">{calculateRemainingSlots(participation)}</p>
                        </div>
                      </div>

                      {participation.selected_products && participation.selected_products.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-700 mb-3">Your Products in this Campaign</h4>
                          <div className="space-y-3">
                            {participation.selected_products.map((product) => (
                              <div key={product.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium text-gray-900">
                                        {product.product_details?.product_name || `Product #${product.product}`}
                                      </h5>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                          product.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                          product.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {product.status}
                                        </span>
                                        {product.discount_updated && (
                                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                            Updated - Pending Approval
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-600">Original Price:</span>
                                        <p className="font-medium">{formatCurrency(product.original_price ?? 0)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Campaign Price:</span>
                                        <p className="font-medium text-green-600">{formatCurrency(product.final_price || 0)}</p>
                                      </div>
                                      {product.discount_percentage && (
                                        <div>
                                          <span className="text-gray-600">Discount:</span>
                                          <p className="font-medium">{product.discount_percentage}% OFF</p>
                                        </div>
                                      )}
                                      {participation.campaign_details?.campaign_type === "Deal of the Day" && product.deal_of_day_placement && (
                                        <div>
                                          <span className="text-gray-600">Placement:</span>
                                          <p className="font-medium text-purple-600">
                                            {getPlacementLabel(product.deal_of_day_placement)}
                                          </p>
                                          {product.deal_of_day_placement === 'banner' && product.is_banner_configured && (
                                            <span className="text-xs text-green-600">
                                              (Banner configured by admin)
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {product.status === 'Approved' && !isCampaignExpired(participation.campaign_details) && (
                                    <div className="flex flex-col gap-2 ml-4">
                                      <button
                                        onClick={() => handleOpenUpdateModal(product)}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                                      >
                                        Update Discount
                                      </button>
                                      {participation.campaign_details?.campaign_type === "Deal of the Day" && (
                                        <button
                                          onClick={() => handleOpenUpdatePlacementModal(product)}
                                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
                                        >
                                          Change Placement
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {product.vendor_updated_at && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    Last updated: {new Date(product.vendor_updated_at).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setParticipationsModalOpen(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {modalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedCampaign.campaign_name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(selectedCampaign.status)}
                    {getCampaignTypeBadge(selectedCampaign.campaign_type)}
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Categories:</label>
                    <p className="mt-1">{getCategoriesDisplay(selectedCampaign)}</p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">Max Products:</label>
                    <p className="mt-1">{selectedCampaign.max_products_per_vendor} per vendor</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Minimum Requirements:</label>
                    <p className="mt-1">
                      {selectedCampaign.campaign_type !== "Featured" && (
                        <span>Min {selectedCampaign.minimum_discount}% discount<br /></span>
                      )}
                      Min {selectedCampaign.minimum_product_limit} products per vendor
                    </p>
                  </div>
                  {selectedCampaign.campaign_type === "Deal of the Day" && selectedCampaign.deal_of_day_placement && (
                    <div>
                      <label className="font-semibold text-gray-700">Product Placement:</label>
                      <p className="mt-1">{getPlacementLabel(selectedCampaign.deal_of_day_placement)}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Start Date:</label>
                    <p className="mt-1">{formatDate(selectedCampaign.start_datetime || selectedCampaign.start_date || "")}</p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">End Date:</label>
                    <p className="mt-1">{formatDate(selectedCampaign.end_datetime || selectedCampaign.end_date || "")}</p>
                  </div>
                </div>

                {selectedCampaign.description && (
                  <div>
                    <label className="font-semibold text-gray-700">Description:</label>
                    <p className="mt-1 text-gray-600">{selectedCampaign.description}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-700 mb-2">Participation Rules:</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>Only products from selected categories can be added</li>
                    <li>Maximum {selectedCampaign.max_products_per_vendor} products per vendor</li>
                    {selectedCampaign.campaign_type !== "Featured" && (
                      <li>Minimum {selectedCampaign.minimum_discount}% discount required per product</li>
                    )}
                    <li>Minimum {selectedCampaign.minimum_product_limit} products required</li>
                    {selectedCampaign.campaign_type === "Deal of the Day" && (
                      <li>You can choose where to display each product (Main, Banner, or List)</li>
                    )}
                    <li>Products require admin approval before going live</li>
                    <li className="text-red-600 font-medium">⚠️ You can only send one participation request per day</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
                {!hasParticipated(selectedCampaign.id) && canJoinCampaign(selectedCampaign) && (
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      handleParticipate(selectedCampaign);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Join Campaign
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Products Modal */}
      {productsModalOpen && selectedParticipation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Add Products to Campaign</h2>
                  <div className="mt-2">
                    <p className="text-gray-700">
                      Campaign: <span className="font-semibold">{selectedParticipation.campaign_details?.campaign_name}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Type: {selectedParticipation.campaign_details?.campaign_type}
                      </span>
                      {selectedParticipation.campaign_details?.campaign_type === "Deal of the Day" && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          Placement: {getPlacementLabel(selectedParticipation.campaign_details?.deal_of_day_placement || 'product_list')}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Remaining Slots: {calculateRemainingSlots(selectedParticipation)}
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Selected: {selectedProducts.length}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setProductsModalOpen(false);
                    setSelectedProducts([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {isCampaignExpired(selectedParticipation.campaign_details) ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Campaign Expired
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          This campaign has ended on <strong>{formatDate(selectedParticipation.campaign_details?.end_datetime || '')}</strong>.
                        </p>
                        <p className="mt-1">
                          You cannot add products to an expired campaign.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Important Information
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          {selectedParticipation.campaign_details?.campaign_type !== "Featured" && (
                            <span><strong>Minimum {selectedParticipation.campaign_details?.minimum_discount}% discount</strong> required per product<br /></span>
                          )}
                          <strong>Minimum {selectedParticipation.campaign_details?.minimum_product_limit} products</strong> required
                        </p>
                        {selectedParticipation.campaign_details?.campaign_type === "Deal of the Day" && (
                          <p className="mt-1">
                            You can choose where to display each product (Main Section, Hero Banner, or Product List)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedParticipation.status !== 'Pending' ? (
                <div className="text-center py-8">
                  <p className="text-gray-700 font-medium mb-2">
                    You cannot add products to a {selectedParticipation.status.toLowerCase()} participation
                  </p>
                </div>
              ) : isCampaignExpired(selectedParticipation.campaign_details) ? (
                <div className="text-center py-8">
                  <p className="text-gray-700 font-medium mb-2">
                    This campaign has ended. You cannot add products.
                  </p>
                  <button
                    onClick={() => {
                      setProductsModalOpen(false);
                      setSelectedProducts([]);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mt-4"
                  >
                    Close
                  </button>
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-700 font-medium mb-4">
                    No products available in required categories
                  </p>
                </div>
              ) : (
                <>
                  {selectedProducts.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-800 mb-3">Selected Products with Discounts</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedProducts.map((product) => (
                            <div key={product.product_id} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{product.product_name}</h4>
                                  <div className="mt-1 space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Original:</span>
                                      <span className="font-medium">{formatCurrency(product.original_price)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Discount:</span>
                                      <span className="font-medium text-green-600">
                                        {product.discount_type === 'percentage'
                                          ? `${product.discount_value}% OFF`
                                          : product.discount_type === 'flat'
                                            ? `Final Price: ${formatCurrency(product.final_price)}`
                                            : 'No discount'
                                        }
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Final Price:</span>
                                      <span className="font-bold text-blue-600">{formatCurrency(product.final_price)}</span>
                                    </div>
                                    {selectedParticipation.campaign_details?.campaign_type === "Deal of the Day" && product.deal_of_day_placement && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Display:</span>
                                        <span className="font-medium text-purple-600">
                                          {getPlacementLabel(product.deal_of_day_placement)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                      Save: {formatCurrency(product.original_price - product.final_price)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleRemoveProduct(product.product_id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  {selectedParticipation.campaign_details?.campaign_type === "Deal of the Day" && (
                                    <button
                                      onClick={() => {
                                        setProductForPlacement(product);
                                        setPlacementModalOpen(true);
                                      }}
                                      className="text-blue-500 hover:text-blue-700"
                                      title="Change placement"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Available Products</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                      {availableProducts.map((product) => {
                        const isSelected = selectedProducts.some(p => p.product_id === product.id);
                        const selectedProduct = selectedProducts.find(p => p.product_id === product.id);
                        const currentTotalSelected = getCurrentSelectedCount();
                        const maxSlots = selectedParticipation.campaign_details?.max_products_per_vendor || 0;
                        const isDisabled = currentTotalSelected >= maxSlots;

                        return (
                          <div
                            key={product.id}
                            className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : isDisabled
                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            onClick={() => !isDisabled && handleProductSelect(product)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-gray-900">{product.product_name}</h4>
                                  {isSelected && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                      Added ✓
                                    </span>
                                  )}
                                  {isDisabled && !isSelected && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                      Limit Reached
                                    </span>
                                  )}
                                </div>

                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Original Price:</span>
                                    <span className="font-semibold text-gray-900">
                                      {formatCurrency(product.original_price)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">MRP:</span>
                                    <span className="text-sm text-gray-500 line-through">
                                      {formatCurrency(product.mrp)}
                                    </span>
                                  </div>

                                  {selectedParticipation.campaign_details?.campaign_type !== "Featured" && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">Min Discount Required:</span>
                                      <span className="text-sm font-medium text-red-600">
                                        {selectedParticipation.campaign_details?.minimum_discount}%
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Stock:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock_quantity > 10 ? 'bg-green-100 text-green-800' :
                                      product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                      {product.stock_quantity} units
                                    </span>
                                  </div>

                                  {selectedProduct && (
                                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-gray-600">Original:</span>
                                          <span className="ml-2 font-medium">{formatCurrency(selectedProduct.original_price)}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-gray-600">Final:</span>
                                          <span className="ml-2 font-bold text-green-700">
                                            {formatCurrency(selectedProduct.final_price)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="mt-1 text-xs text-gray-600">
                                        {selectedProduct.discount_type === 'percentage'
                                          ? `${selectedProduct.discount_value}% discount applied`
                                          : selectedProduct.discount_type === 'flat'
                                            ? 'Special price applied'
                                            : 'No discount'
                                        }
                                      </div>
                                      {selectedParticipation.campaign_details?.campaign_type === "Deal of the Day" && selectedProduct.deal_of_day_placement && (
                                        <div className="mt-1 text-xs text-purple-600">
                                          Display: {getPlacementLabel(selectedProduct.deal_of_day_placement)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              {product.stocks && product.stocks.length > 1 && (
                                <div className="text-xs text-gray-500">
                                  {product.stocks.length} variants available
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-500">
                      {availableProducts.length} products available • {selectedProducts.length} selected • {calculateRemainingSlots(selectedParticipation)} slots remaining
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setProductsModalOpen(false);
                          setSelectedProducts([]);
                        }}
                        className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddProductsToCampaign}
                        disabled={selectedProducts.length === 0}
                        className={`px-5 py-2 rounded-lg font-medium flex items-center gap-2 ${selectedProducts.length > 0
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Add {selectedProducts.length} Product(s) to Campaign
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Product Discount Modal */}
      {updateModalOpen && productToUpdate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Update Product Discount</h3>
                  <p className="text-gray-600 text-sm mt-1">{productToUpdate.product_details?.product_name}</p>
                  <p className="text-gray-700 font-medium mt-2">
                    Current Price: <span className="text-blue-600">{formatCurrency(productToUpdate.final_price || 0)}</span>
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Note: Updating discount will require admin approval again
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUpdateModalOpen(false);
                    setProductToUpdate(null);
                    updateProductFormik.resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={updateProductFormik.handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="discount_type"
                          value="percentage"
                          checked={updateProductFormik.values.discount_type === 'percentage'}
                          onChange={updateProductFormik.handleChange}
                          className="text-blue-600"
                        />
                        <span className="ml-2">Percentage (%)</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="discount_type"
                          value="flat"
                          checked={updateProductFormik.values.discount_type === 'flat'}
                          onChange={updateProductFormik.handleChange}
                          className="text-blue-600"
                        />
                        <span className="ml-2">Flat (Final Price ₹)</span>
                      </label>
                    </div>
                  </div>

                  {updateProductFormik.values.discount_type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Percentage
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          name="discount_value"
                          min="1"
                          max="100"
                          value={updateProductFormik.values.discount_value}
                          onChange={updateProductFormik.handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter percentage"
                        />
                        <span className="ml-2">%</span>
                      </div>
                      {updateProductFormik.touched.discount_value && updateProductFormik.errors.discount_value && (
                        <div className="text-red-500 text-sm mt-1">{updateProductFormik.errors.discount_value}</div>
                      )}
                    </div>
                  )}

                  {updateProductFormik.values.discount_type === 'flat' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Price (₹)
                      </label>
                      <input
                        type="number"
                        name="special_price"
                        min="1"
                        value={updateProductFormik.values.special_price}
                        onChange={updateProductFormik.handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter final price"
                      />
                      {updateProductFormik.touched.special_price && updateProductFormik.errors.special_price && (
                        <div className="text-red-500 text-sm mt-1">{updateProductFormik.errors.special_price}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Important:</strong> After updating, this product will go back to "Pending" status and require admin approval.
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateModalOpen(false);
                        setProductToUpdate(null);
                        updateProductFormik.resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Update Product
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Product Placement Modal */}
      {updatePlacementModalOpen && productToUpdatePlacement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Update Product Placement</h3>
                  <p className="text-gray-600 text-sm mt-1">{productToUpdatePlacement.product_details?.product_name}</p>
                  <p className="text-gray-700 text-sm mt-2">
                    Current Placement: <span className="font-semibold">
                      {getPlacementLabel(productToUpdatePlacement.deal_of_day_placement || 'product_list')}
                    </span>
                  </p>
                  {productToUpdatePlacement.deal_of_day_placement === 'banner' && productToUpdatePlacement.is_banner_configured && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Note: Banner was configured by admin. Changing placement will reset banner configuration.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setUpdatePlacementModalOpen(false);
                    setProductToUpdatePlacement(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={updatePlacementFormik.handleSubmit}>
                <div className="space-y-3">
                  <div className={`border rounded-lg p-4 cursor-pointer transition-all ${updatePlacementFormik.values.deal_of_day_placement === 'main' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => updatePlacementFormik.setFieldValue('deal_of_day_placement', 'main')}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deal_of_day_placement"
                        value="main"
                        checked={updatePlacementFormik.values.deal_of_day_placement === 'main'}
                        onChange={() => updatePlacementFormik.setFieldValue('deal_of_day_placement', 'main')}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">Main Image Section</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Featured prominently in the main deal of the day section with large images
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 cursor-pointer transition-all ${updatePlacementFormik.values.deal_of_day_placement === 'banner' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => updatePlacementFormik.setFieldValue('deal_of_day_placement', 'banner')}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deal_of_day_placement"
                        value="banner"
                        checked={updatePlacementFormik.values.deal_of_day_placement === 'banner'}
                        onChange={() => updatePlacementFormik.setFieldValue('deal_of_day_placement', 'banner')}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">Hero Banner Image</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Displayed in the hero banner section (rotating banner at the top)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 cursor-pointer transition-all ${updatePlacementFormik.values.deal_of_day_placement === 'product_list' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => updatePlacementFormik.setFieldValue('deal_of_day_placement', 'product_list')}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deal_of_day_placement"
                        value="product_list"
                        checked={updatePlacementFormik.values.deal_of_day_placement === 'product_list'}
                        onChange={() => updatePlacementFormik.setFieldValue('deal_of_day_placement', 'product_list')}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">Deal of the Day List</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Listed in the deal of the day product grid/list view
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-4">
                    Selected placement: <span className="font-semibold text-blue-600">
                      {getPlacementLabel(updatePlacementFormik.values.deal_of_day_placement)}
                    </span>
                    {updatePlacementFormik.values.deal_of_day_placement === 'banner' && productToUpdatePlacement.deal_of_day_placement !== 'banner' && (
                      <span className="block text-yellow-600 text-xs mt-1">
                        Banner configuration will be reset and need to be configured by admin again.
                      </span>
                    )}
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUpdatePlacementModalOpen(false);
                        setProductToUpdatePlacement(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Update Placement
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {discountModalOpen && currentProduct && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Add Discount</h3>
                  <p className="text-gray-600 text-sm mt-1">{currentProduct.product_name}</p>
                  <p className="text-gray-700 font-medium mt-2">
                    Original Price: <span className="text-blue-600">{formatCurrency(currentProduct.original_price)}</span>
                  </p>
                  {selectedParticipation?.campaign_details?.campaign_type !== "Featured" && (
                    <p className="text-sm text-red-600 mt-1">
                      Minimum {selectedParticipation?.campaign_details?.minimum_discount}% discount required
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setDiscountModalOpen(false);
                    setCurrentProduct(null);
                    discountFormik.resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={discountFormik.handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="discount_type"
                          value="percentage"
                          checked={discountFormik.values.discount_type === 'percentage'}
                          onChange={discountFormik.handleChange}
                          className="text-blue-600"
                        />
                        <span className="ml-2">Percentage (%)</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="discount_type"
                          value="flat"
                          checked={discountFormik.values.discount_type === 'flat'}
                          onChange={discountFormik.handleChange}
                          className="text-blue-600"
                        />
                        <span className="ml-2">Flat (Final Price ₹)</span>
                      </label>
                    </div>
                  </div>

                  {discountFormik.values.discount_type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Percentage
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          name="discount_value"
                          min={selectedParticipation?.campaign_details?.minimum_discount || 1}
                          max="100"
                          value={discountFormik.values.discount_value}
                          onChange={discountFormik.handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter percentage"
                        />
                        <span className="ml-2">%</span>
                      </div>
                      {discountFormik.touched.discount_value && discountFormik.errors.discount_value && (
                        <div className="text-red-500 text-sm mt-1">{discountFormik.errors.discount_value}</div>
                      )}
                      {discountFormik.values.discount_value && (
                        <div className="mt-2 text-sm text-gray-600">
                          Final Price: {formatCurrency(
                            currentProduct.original_price -
                            (currentProduct.original_price * discountFormik.values.discount_value) / 100
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {discountFormik.values.discount_type === 'flat' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Price (₹)
                      </label>
                      <input
                        type="number"
                        name="special_price"
                        min="1"
                        max={currentProduct.original_price}
                        value={discountFormik.values.special_price}
                        onChange={discountFormik.handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter final price"
                      />
                      {discountFormik.touched.special_price && discountFormik.errors.special_price && (
                        <div className="text-red-500 text-sm mt-1">{discountFormik.errors.special_price}</div>
                      )}
                      {discountFormik.values.special_price && (
                        <div className="mt-2 text-sm text-gray-600">
                          You save: {formatCurrency(
                            currentProduct.original_price - parseFloat(discountFormik.values.special_price)
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {currentProduct.stocks && currentProduct.stocks.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Variant
                      </label>
                      <select
                        name="stock_variant"
                        value={discountFormik.values.stock_variant}
                        onChange={discountFormik.handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>All Variants</option>
                        {currentProduct.stocks.map((stock, index) => (
                          <option key={stock.id} value={stock.id}>
                            {stock.color || 'Default'} {stock.size ? `- ${stock.size}` : ''}
                            ({formatCurrency(stock.selling_price)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountModalOpen(false);
                      setCurrentProduct(null);
                      discountFormik.resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {selectedProducts.some(p => p.product_id === currentProduct.id) ? 'Update' : 'Add'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deal of the Day Placement Modal */}
      {placementModalOpen && productForPlacement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Select Product Placement</h3>
                  <p className="text-gray-600 text-sm mt-1">{productForPlacement.product_name}</p>
                  <p className="text-gray-700 text-sm mt-2">
                    Choose where this product should appear on the website
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPlacementModalOpen(false);
                    setProductForPlacement(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={placementFormik.handleSubmit}>
                <div className="space-y-3">
                  <div className={`border rounded-lg p-4 cursor-pointer transition-all ${placementFormik.values.deal_of_day_placement === 'main' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => handlePlacementSelect('main')}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deal_of_day_placement"
                        value="main"
                        checked={placementFormik.values.deal_of_day_placement === 'main'}
                        onChange={() => handlePlacementSelect('main')}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">Main Image Section</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Featured prominently in the main deal of the day section with large images
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 cursor-pointer transition-all ${placementFormik.values.deal_of_day_placement === 'banner' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => handlePlacementSelect('banner')}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deal_of_day_placement"
                        value="banner"
                        checked={placementFormik.values.deal_of_day_placement === 'banner'}
                        onChange={() => handlePlacementSelect('banner')}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">Hero Banner Image</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Displayed in the hero banner section (rotating banner at the top)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 cursor-pointer transition-all ${placementFormik.values.deal_of_day_placement === 'product_list' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => handlePlacementSelect('product_list')}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deal_of_day_placement"
                        value="product_list"
                        checked={placementFormik.values.deal_of_day_placement === 'product_list'}
                        onChange={() => handlePlacementSelect('product_list')}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">Deal of the Day List</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Listed in the deal of the day product grid/list view
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-4">
                    Selected placement: <span className="font-semibold text-blue-600">
                      {getPlacementLabel(placementFormik.values.deal_of_day_placement)}
                    </span>
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPlacementModalOpen(false);
                        setProductForPlacement(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Continue to Discount
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorCampaigns;